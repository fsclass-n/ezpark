package com.ezpark.member;

import com.ezpark.common.ApiException;
import com.ezpark.common.LoginUser;
import com.ezpark.common.Patterns;
import com.ezpark.lot.LotRepository;
import com.ezpark.user.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** 마이페이지: 회원 정보 수정, 내 차량, 즐겨찾기 (로그인 필요) */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private static final int MAX_VEHICLES = 5;
    private static final Set<String> CAR_TYPES = Set.of("소형", "중형", "대형", "전기차");

    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final LotRepository lotRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public record ProfileRequest(
            @NotBlank(message = "이름을 입력해 주세요.") @Size(min = 2, max = 20, message = "이름은 2~20자로 입력해 주세요.") String name,
            @Pattern(regexp = "^$|" + Patterns.PHONE, message = "휴대폰 번호 형식을 확인해 주세요.") String phone,
            @Pattern(regexp = "^$|" + Patterns.PASSWORD, message = "비밀번호는 영문·숫자·특수문자 포함 8자 이상이어야 합니다.") String newPassword) {
    }

    public record VehicleRequest(
            @NotBlank(message = "차량번호를 입력해 주세요.") @Pattern(regexp = Patterns.PLATE, message = "예) 12가3456, 123가4567") String plate,
            @NotBlank(message = "모델명을 입력해 주세요.") @Size(max = 40) String model,
            @NotBlank(message = "구분을 선택해 주세요.") String type) {
    }

    @PutMapping
    public Map<String, String> updateProfile(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user,
                                             @Valid @RequestBody ProfileRequest req, HttpSession session) {
        String name = req.name().trim();
        userRepository.updateProfile(user.id(), name, StringUtils.hasText(req.phone()) ? req.phone().trim() : null);
        if (StringUtils.hasText(req.newPassword())) {
            userRepository.updatePassword(user.id(), passwordEncoder.encode(req.newPassword()));
        }
        session.setAttribute(LoginUser.SESSION_KEY, new LoginUser(user.id(), user.email(), name, user.role()));
        return Map.of("message", "회원 정보가 저장되었습니다.");
    }

    @GetMapping("/vehicles")
    public List<MemberRepository.Vehicle> vehicles(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user) {
        return memberRepository.findVehicles(user.id());
    }

    @PostMapping("/vehicles")
    @Transactional
    public ResponseEntity<List<MemberRepository.Vehicle>> addVehicle(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user,
                                                                     @Valid @RequestBody VehicleRequest req) {
        String plate = req.plate().replaceAll("\\s", "");
        if (!CAR_TYPES.contains(req.type())) throw ApiException.badRequest("차량 구분을 선택해 주세요.");
        int count = memberRepository.countVehicles(user.id());
        if (count >= MAX_VEHICLES) throw ApiException.badRequest("차량은 최대 5대까지 등록할 수 있습니다.");
        if (memberRepository.existsVehicle(user.id(), plate)) throw ApiException.conflict("이미 등록된 차량번호입니다.");
        memberRepository.insertVehicle(user.id(), plate, req.model().trim(), req.type(), count == 0);
        return ResponseEntity.status(HttpStatus.CREATED).body(memberRepository.findVehicles(user.id()));
    }

    @PatchMapping("/vehicles/{id}/main")
    @Transactional
    public List<MemberRepository.Vehicle> setMain(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user, @PathVariable Long id) {
        if (memberRepository.setMainVehicle(user.id(), id) == 0) throw ApiException.notFound("차량을 찾을 수 없습니다.");
        return memberRepository.findVehicles(user.id());
    }

    @DeleteMapping("/vehicles/{id}")
    @Transactional
    public List<MemberRepository.Vehicle> deleteVehicle(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user, @PathVariable Long id) {
        if (memberRepository.deleteVehicle(user.id(), id) == 0) throw ApiException.notFound("차량을 찾을 수 없습니다.");
        memberRepository.ensureMainVehicle(user.id());
        return memberRepository.findVehicles(user.id());
    }

    @GetMapping("/favorites")
    public List<Long> favorites(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user) {
        return memberRepository.findFavoriteLotIds(user.id());
    }

    @PutMapping("/favorites/{lotId}")
    public List<Long> addFavorite(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user, @PathVariable Long lotId) {
        lotRepository.findById(lotId).orElseThrow(() -> ApiException.notFound("주차장을 찾을 수 없습니다."));
        memberRepository.addFavorite(user.id(), lotId);
        return memberRepository.findFavoriteLotIds(user.id());
    }

    @DeleteMapping("/favorites/{lotId}")
    public List<Long> removeFavorite(@SessionAttribute(LoginUser.SESSION_KEY) LoginUser user, @PathVariable Long lotId) {
        memberRepository.removeFavorite(user.id(), lotId);
        return memberRepository.findFavoriteLotIds(user.id());
    }
}
