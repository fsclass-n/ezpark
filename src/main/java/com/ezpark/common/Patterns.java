package com.ezpark.common;

/** 프런트엔드(HTML pattern)와 동일한 입력 형식 – 서버에서도 반드시 다시 검증한다 */
public final class Patterns {

    public static final String PLATE = "^\\d{2,3}[가-힣]\\d{4}$";
    public static final String PHONE = "^01[016789]-?\\d{3,4}-?\\d{4}$";
    public static final String TEL = "^0\\d{1,2}-?\\d{3,4}-?\\d{4}$";
    public static final String PASSWORD = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,64}$";

    private Patterns() {
    }
}
