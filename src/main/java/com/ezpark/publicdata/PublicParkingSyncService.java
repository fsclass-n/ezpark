package com.ezpark.publicdata;

import com.ezpark.common.ApiException;
import com.ezpark.config.EzparkProperties;
import com.ezpark.lot.LotRepository;
import com.ezpark.lot.ParkingLot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * 공공데이터포털 「전국주차장정보표준데이터」(tn_pubr_prkplce_info_api) → parking_lots 동기화
 * - 공영 주차장만 적재, 주차장관리번호(prkplceNo)를 external_no 로 사용해 중복 없이 갱신
 * - 잔여면(available)은 표준데이터에 없으므로 신규 등록 시 주차면수로 초기화한다
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublicParkingSyncService {

    private static final Map<String, String> REGIONS = Map.ofEntries(
            Map.entry("서울특별시", "서울"), Map.entry("부산광역시", "부산"), Map.entry("대구광역시", "대구"), Map.entry("인천광역시", "인천"),
            Map.entry("광주광역시", "광주"), Map.entry("대전광역시", "대전"), Map.entry("울산광역시", "울산"), Map.entry("세종특별자치시", "세종"),
            Map.entry("경기도", "경기"), Map.entry("강원특별자치도", "강원"), Map.entry("강원도", "강원"), Map.entry("충청북도", "충북"),
            Map.entry("충청남도", "충남"), Map.entry("전북특별자치도", "전북"), Map.entry("전라북도", "전북"), Map.entry("전라남도", "전남"),
            Map.entry("경상북도", "경북"), Map.entry("경상남도", "경남"), Map.entry("제주특별자치도", "제주"));

    private final EzparkProperties props;
    private final LotRepository lotRepository;

    public record SyncResult(int fetched, int inserted, int updated, int skipped, int totalCount) {
    }

    @SuppressWarnings("unchecked")
    public SyncResult sync(int pageNo, int numOfRows, String keyword) {
        EzparkProperties.PublicData cfg = props.getPublicData();
        if (cfg.getServiceKey() == null || cfg.getServiceKey().isBlank()) {
            throw ApiException.badRequest("PUBLIC_DATA_SERVICE_KEY 가 설정되지 않았습니다. 공공데이터포털에서 인증키를 발급받아 환경변수에 등록해 주세요.");
        }
        // serviceKey 의 +, /, = 문자가 그대로 전송되지 않도록 URI 변수로 엄격하게 인코딩한다
        URI uri = UriComponentsBuilder.fromUriString(cfg.getUrl())
                .queryParam("serviceKey", "{key}")
                .queryParam("pageNo", pageNo)
                .queryParam("numOfRows", numOfRows)
                .queryParam("type", "json")
                .encode()
                .buildAndExpand(cfg.getServiceKey())
                .toUri();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(30_000);
        Map<String, Object> res;
        try {
            res = RestClient.builder().requestFactory(factory).build().get().uri(uri).retrieve().body(Map.class);
        } catch (Exception e) {
            log.warn("공공데이터 API 호출 실패: {}", e.getMessage());
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY, "공공데이터 API 호출에 실패했습니다. 인증키와 활용 승인 상태를 확인해 주세요.");
        }
        // 응답 형식: {"header":{...},"body":{"items":{"item":[...]}}} (일부 API 는 바깥에 "response" 가 한 번 더 감싼다)
        Map<String, Object> root = res == null ? Map.of() : res.get("response") instanceof Map<?, ?> r ? (Map<String, Object>) r : res;
        Map<String, Object> header = root.get("header") instanceof Map<?, ?> h ? (Map<String, Object>) h : Map.of();
        if (header.get("resultCode") != null && !"00".equals(String.valueOf(header.get("resultCode")))) {
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY, "공공데이터 API 오류: " + header.get("resultMsg"));
        }
        Map<String, Object> body = root.get("body") instanceof Map<?, ?> b ? (Map<String, Object>) b : null;
        if (body == null) {
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY, "공공데이터 API 응답 형식이 올바르지 않습니다.");
        }
        Object items = body.get("items");
        Object rows = items instanceof Map<?, ?> m ? m.get("item") : items;
        List<Map<String, Object>> list = rows instanceof List<?> l ? (List<Map<String, Object>>) l
                : rows instanceof Map<?, ?> one ? List.of((Map<String, Object>) one) : List.of();

        int inserted = 0, updated = 0, skipped = 0;
        for (Map<String, Object> item : list) {
            ParkingLot lot = toLot(item);
            if (lot == null || (keyword != null && !keyword.isBlank() && !lot.getAddr().contains(keyword))) {
                skipped++;
                continue;
            }
            if (lotRepository.updateFromPublic(lot) > 0) {
                updated++;
            } else {
                lotRepository.insert(lot);
                inserted++;
            }
        }
        return new SyncResult(list.size(), inserted, updated, skipped, toInt(body.get("totalCount")));
    }

    private ParkingLot toLot(Map<String, Object> it) {
        if (!"공영".equals(str(it, "prkplceSe"))) return null;
        double lat = toDouble(it.get("latitude")), lng = toDouble(it.get("longitude"));
        String no = str(it, "prkplceNo"), name = str(it, "prkplceNm");
        String addr = str(it, "rdnmadr").isBlank() ? str(it, "lnmadr") : str(it, "rdnmadr");
        int total = toInt(it.get("prkcmprt"));
        if (no.isBlank() || name.isBlank() || addr.isBlank() || lat == 0 || lng == 0 || total <= 0) return null;

        String[] tokens = addr.split("\\s+");
        String region = REGIONS.getOrDefault(tokens[0], tokens[0].length() > 2 ? tokens[0].substring(0, 2) : tokens[0]);
        String type = List.of("노외", "노상", "부설").contains(str(it, "prkplceType")) ? str(it, "prkplceType") : "노외";
        boolean free = "무료".equals(str(it, "parkingchrgeInfo"));
        int basicTime = toInt(it.get("basicTime")), basicCharge = toInt(it.get("basicCharge"));
        int addTime = toInt(it.get("addUnitTime")), addCharge = toInt(it.get("addUnitCharge")), day = toInt(it.get("dayCmmtkt"));
        int fee10 = free ? 0 : addTime > 0 ? Math.round(addCharge * 10f / addTime) : basicTime > 0 ? Math.round(basicCharge * 10f / basicTime) : 0;
        String feeShort = free || basicTime == 0 ? (free ? "무료" : "현장 확인") : basicTime + "분 " + String.format("%,d원", basicCharge);
        StringBuilder feeText = new StringBuilder(feeShort.equals("무료") ? "무료" : "기본 " + feeShort);
        if (!free && addTime > 0) feeText.append(" · 추가 ").append(addTime).append("분 ").append(String.format("%,d원", addCharge));
        if (!free && day > 0) feeText.append(" · 1일 ").append(String.format("%,d원", day));
        String yn = str(it, "pwdbsPpkZoneYn");

        return ParkingLot.builder()
                .externalNo(no).name(name).region(region).area(tokens.length > 1 ? tokens[1] : "").addr(addr).type(type)
                .total(total).available(total).fee10(fee10).feeShort(feeShort).feeText(feeText.toString()).dayMax(free ? 0 : day)
                .hours((str(it, "operDay") + " " + str(it, "weekdayOperOpenHhmm") + "~" + str(it, "weekdayOperColseHhmm")).trim())
                .manager(str(it, "institutionNm")).tel(str(it, "phoneNumber"))
                .ev(null).disabled("Y".equals(yn) ? Boolean.TRUE : "N".equals(yn) ? Boolean.FALSE : null)
                .lat(lat).lng(lng)
                .photo("노상".equals(type) ? "street" : "부설".equals(type) ? "garageDark" : "aerialLines")
                .floors(List.of("부설".equals(type) ? "B1" : "지상")).tags(List.of("공공데이터", type))
                .dataSource("PUBLIC")
                .build();
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? "" : String.valueOf(v).trim();
    }

    private static int toInt(Object v) {
        try {
            return v == null ? 0 : (int) Math.round(Double.parseDouble(String.valueOf(v).replace(",", "").trim()));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static double toDouble(Object v) {
        try {
            return v == null ? 0 : Double.parseDouble(String.valueOf(v).trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
