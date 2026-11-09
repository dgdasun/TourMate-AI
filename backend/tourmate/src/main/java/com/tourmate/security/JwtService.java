package com.tourmate.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.tourmate.entity.User;
import com.tourmate.enums.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** Issues and verifies HMAC-SHA256 signed JWT access tokens. */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String ISSUER = "tourmate-ai";
    static final String DEV_SECRET = "tourmate-dev-secret-change-me-in-production-please-32+";

    private final byte[] secret;
    private final Duration ttl;

    public JwtService(@Value("${tourmate.jwt.secret}") String secret,
                      @Value("${tourmate.jwt.expiry-hours:24}") long expiryHours) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < 32) {
            throw new IllegalStateException("tourmate.jwt.secret (JWT_SECRET) must be at least 32 characters");
        }
        if (DEV_SECRET.equals(secret)) {
            log.warn("Using the built-in development JWT secret - set JWT_SECRET before deploying");
        }
        this.ttl = Duration.ofHours(expiryHours);
    }

    public long ttlSeconds() {
        return ttl.toSeconds();
    }

    public String issue(User user) {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(ISSUER)
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("role", user.getRole().name())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(ttl)))
                .build();
        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(secret));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Could not sign JWT", e);
        }
    }

    /** Returns the user if the token is well-formed, correctly signed, issued by us and not expired. */
    public Optional<AuthUser> verify(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!JWSAlgorithm.HS256.equals(jwt.getHeader().getAlgorithm()) || !jwt.verify(new MACVerifier(secret))) {
                return Optional.empty();
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date expiry = claims.getExpirationTime();
            if (!ISSUER.equals(claims.getIssuer()) || expiry == null || expiry.before(new Date())) {
                return Optional.empty();
            }
            return Optional.of(new AuthUser(Long.valueOf(claims.getSubject()), claims.getStringClaim("email"),
                    claims.getStringClaim("name"), Role.valueOf(claims.getStringClaim("role"))));
        } catch (ParseException | JOSEException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
