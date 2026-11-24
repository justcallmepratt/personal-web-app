package com.resume.controller;

import com.resume.dto.LoginRequest;
import com.resume.model.Message;
import com.resume.repository.MessageRepository;
import com.resume.security.JwtUtil;
import com.resume.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final JwtUtil jwt;
    private final PasswordEncoder encoder;
    private final MessageRepository messages;
    private final String adminUser;
    private final String adminPassHash;
    private final LoginRateLimiter loginLimiter;

    public AdminController(JwtUtil jwt,
                           PasswordEncoder encoder,
                           MessageRepository messages,
                           LoginRateLimiter loginLimiter,
                           @Value("${admin.username:admin}") String adminUser,
                           @Value("${admin.password-hash:}") String adminPassHash) {
        this.jwt = jwt;
        this.encoder = encoder;
        this.messages = messages;
        this.loginLimiter = loginLimiter;
        this.adminUser = adminUser;
        this.adminPassHash = adminPassHash;
    }

    /** Prefers the forwarded address set by the hosting proxy; falls back to the socket address. */
    private static String clientAddress(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletRequest httpReq) {
        if (adminPassHash == null || adminPassHash.isBlank()) {
            return ResponseEntity.status(503).body(Map.of("error", "Admin not configured"));
        }
        String client = clientAddress(httpReq);
        if (loginLimiter.isBlocked(client)) {
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(loginLimiter.windowSeconds()))
                    .body(Map.of("error", "Too many failed sign-in attempts. Try again later."));
        }
        if (!adminUser.equals(req.username()) || !encoder.matches(req.password(), adminPassHash)) {
            loginLimiter.recordFailure(client);
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        loginLimiter.recordSuccess(client);
        return ResponseEntity.ok(Map.of("token", jwt.generate(adminUser)));
    }

    @GetMapping("/messages")
    public List<Message> messages() { return messages.findAllByOrderBySentAtDesc(); }

    /**
     * Sets a message's read flag to {@code read} (default true). Setting, not
     * toggling, so a retried or double-sent request leaves the same state.
     */
    @PatchMapping("/messages/{id}/read")
    public ResponseEntity<Message> markRead(@PathVariable Long id,
                                            @RequestParam(defaultValue = "true") boolean read) {
        return messages.findById(id).map(m -> {
            m.setRead(read);
            return ResponseEntity.ok(messages.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }
}
