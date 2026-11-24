package com.resume.config;

import com.resume.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleValidation_returns400_withFieldErrorMessage() throws Exception {
        // Create a MethodArgumentNotValidException with a field error
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "name", "must not be blank"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResponse> response = handler.handleValidation(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
        assertThat(response.getBody().message()).contains("name").contains("must not be blank");
    }

    @Test
    void handleConstraint_returns400_withMessage() {
        ConstraintViolationException ex = new ConstraintViolationException("constraint violated", Set.of());

        ResponseEntity<ApiResponse> response = handler.handleConstraint(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
        assertThat(response.getBody().message()).contains("constraint violated");
    }

    @Test
    void handleGeneral_returns500_withInternalServerError() {
        Exception ex = new RuntimeException("Something went wrong");

        ResponseEntity<ApiResponse> response = handler.handleGeneral(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
        assertThat(response.getBody().message()).isEqualTo("Internal server error");
    }

    @Test
    void handleGeneral_keepsTheStatusOfSpringRequestErrors() {
        var ex = new org.springframework.web.servlet.resource.NoResourceFoundException(
            org.springframework.http.HttpMethod.GET, "/actuator/env", "actuator/env");

        ResponseEntity<ApiResponse> response = handler.handleGeneral(ex);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody().message()).isEqualTo("Not Found");
    }

    @Test
    void handleBadInput_returns400_withAGenericMessage() {
        ResponseEntity<ApiResponse> response = handler.handleBadInput();

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("Invalid request");
    }
}
