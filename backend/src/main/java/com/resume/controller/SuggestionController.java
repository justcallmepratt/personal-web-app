package com.resume.controller;

import com.resume.dto.SuggestionRequest;
import com.resume.dto.SuggestionResponse;
import com.resume.dto.SuggestionTarget;
import com.resume.service.SuggestionException;
import com.resume.service.SuggestionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Suggest-and-approve for profile and resume content. Everything here is under
 * {@code /api/admin/**}, which {@code SecurityConfig} restricts to the admin JWT.
 *
 * <p>Errors are {@code {"error": text, "code": code}}; a {@code conflict} also carries
 * {@code currentValue}, the value the target holds now.
 */
@RestController
@RequestMapping("/api/admin/suggestions")
public class SuggestionController {
    private final SuggestionService service;

    public SuggestionController(SuggestionService service) { this.service = service; }

    @GetMapping
    public List<SuggestionResponse> list(@RequestParam(required = false) String status) {
        return service.list(status);
    }

    @GetMapping("/targets")
    public List<SuggestionTarget> targets() { return service.targets(); }

    @GetMapping("/{id}")
    public SuggestionResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<SuggestionResponse> create(@RequestBody SuggestionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PostMapping("/{id}/accept")
    public SuggestionResponse accept(@PathVariable Long id) { return service.accept(id); }

    @PostMapping("/{id}/reject")
    public SuggestionResponse reject(@PathVariable Long id) { return service.reject(id); }

    @ExceptionHandler(SuggestionException.class)
    public ResponseEntity<Map<String, Object>> refused(SuggestionException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", ex.getMessage());
        body.put("code", ex.getCode());
        if (ex.hasLiveValue()) body.put("currentValue", ex.getLiveValue());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    /** A body that is not JSON, or an id that is not a number, is the caller's mistake, not a 500. */
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> unreadable() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "The request could not be read.");
        body.put("code", "invalid");
        return ResponseEntity.badRequest().body(body);
    }
}
