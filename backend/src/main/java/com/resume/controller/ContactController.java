package com.resume.controller;

import com.resume.dto.ApiResponse;
import com.resume.dto.ContactRequest;
import com.resume.service.ContactService;
import com.resume.service.EmailValidationService;
import com.resume.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService          svc;
    private final EmailValidationService  emailValidator;
    private final RateLimitService        rateLimiter;

    public ContactController(ContactService svc,
                             EmailValidationService emailValidator,
                             RateLimitService rateLimiter) {
        this.svc            = svc;
        this.emailValidator = emailValidator;
        this.rateLimiter    = rateLimiter;
    }

    /**
     * Validate an email address before submission.
     * Called client-side on blur so the user gets immediate feedback.
     */
    @GetMapping("/validate-email")
    public ResponseEntity<ApiResponse> validateEmail(@RequestParam String email) {
        EmailValidationService.ValidationResult result = emailValidator.validate(email);
        if (!result.valid()) {
            return ResponseEntity.unprocessableEntity()
                    .body(new ApiResponse(false, result.reason()));
        }
        return ResponseEntity.ok(new ApiResponse(true, "Email looks good."));
    }

    /**
     * Submit the contact form.
     * Guards:
     *  1. Bean Validation (@NotBlank, @Email, @Size)
     *  2. IP-based rate limit (3 submissions / hour)
     *  3. Email domain validation (MX check + disposable blocklist + pattern)
     */
    @PostMapping
    public ResponseEntity<ApiResponse> submit(
            @Valid @RequestBody ContactRequest req,
            HttpServletRequest httpReq) {

        // ── 1. Rate limiting ────────────────────────────────────────────────
        String ip = extractIp(httpReq);
        if (!rateLimiter.isAllowed(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ApiResponse(false,
                            "Too many submissions from your connection. Please try again later."));
        }

        // ── 2. Email domain validation ──────────────────────────────────────
        EmailValidationService.ValidationResult emailCheck = emailValidator.validate(req.email());
        if (!emailCheck.valid()) {
            // Nothing was saved or sent, so this attempt does not count against the limit.
            rateLimiter.release(ip);
            return ResponseEntity.unprocessableEntity()
                    .body(new ApiResponse(false, emailCheck.reason()));
        }

        // ── 3. Persist + notify ─────────────────────────────────────────────
        svc.handle(req);
        return ResponseEntity.ok(new ApiResponse(true, "Message received. I'll get back to you soon."));
    }

    /** Prefer X-Forwarded-For (Vercel/Railway proxy), fall back to direct remote addr. */
    private String extractIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();  // first hop is the real client
        }
        return req.getRemoteAddr();
    }
}
