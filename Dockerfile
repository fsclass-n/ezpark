# =========================================================
# EzPark 백엔드 이미지 (Render Web Service / AWS EC2 공용)
#   docker build -t ezpark .
#   docker run -p 8080:8080 --env-file .env ezpark
# 환경변수(DB_URL 등)는 .env.example 참고 – 이미지에 비밀값을 넣지 않는다.
# =========================================================
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null
COPY src src
RUN ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV TZ=Asia/Seoul
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
