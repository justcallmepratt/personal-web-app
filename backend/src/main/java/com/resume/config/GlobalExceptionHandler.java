package com.resume.config;

import com.resume.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(new ApiResponse(false, msg));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
    }

    /**
     * Spring's own request errors (unknown path, wrong method, missing
     * parameter, unsupported media type) carry their status. Keep it, so an
     * unknown URL is a 404 and not a 500, but say nothing more than the reason.
     */
    static ResponseEntity<ApiResponse> fromErrorResponse(ErrorResponse ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        String reason = status != null ? status.getReasonPhrase() : "Request failed";
        // Keep headers such as Allow (405) and Accept (415).
        return ResponseEntity.status(ex.getStatusCode()).headers(ex.getHeaders()).body(new ApiResponse(false, reason));
    }

    /** A malformed JSON body or a path variable of the wrong type is the caller's mistake. */
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse> handleBadInput(Exception ex) {
        return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid request"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGeneral(Exception ex) {
        if (ex instanceof ErrorResponse framework) return fromErrorResponse(framework);
        // The client gets a generic message; the cause belongs in the log.
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Internal server error"));
    }
}
