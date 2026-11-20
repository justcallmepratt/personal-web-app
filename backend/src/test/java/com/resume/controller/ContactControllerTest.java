package com.resume.controller;

import tools.jackson.databind.ObjectMapper;
import com.resume.dto.ContactRequest;
import com.resume.model.Message;
import com.resume.security.JwtFilter;
import com.resume.security.JwtUtil;
import com.resume.service.ContactService;
import com.resume.service.EmailValidationService;
import com.resume.service.RateLimitService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ContactController.class)
@AutoConfigureMockMvc(addFilters = false)
class ContactControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean ContactService         contactService;
    @MockitoBean EmailValidationService emailValidator;
    @MockitoBean RateLimitService       rateLimiter;
    @MockitoBean JwtUtil                jwtUtil;
    @MockitoBean JwtFilter              jwtFilter;

    @Test
    void postContact_withValidBody_returns200WithSuccessTrue() throws Exception {
        when(rateLimiter.isAllowed(anyString())).thenReturn(true);
        when(emailValidator.validate(anyString()))
                .thenReturn(EmailValidationService.ValidationResult.ok());
        when(contactService.handle(any(ContactRequest.class))).thenReturn(new Message());

        String body = objectMapper.writeValueAsString(
                new ContactRequest("Alice", "alice@example.com", "Hello", "World payload here"));

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void postContact_withBlankName_returns400() throws Exception {
        String body = "{\"name\":\"\",\"email\":\"alice@example.com\",\"subject\":\"Hi\",\"body\":\"Payload\"}";
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postContact_withInvalidEmail_returns400() throws Exception {
        String body = "{\"name\":\"Alice\",\"email\":\"not-an-email\",\"subject\":\"Hi\",\"body\":\"Payload\"}";
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postContact_rateLimited_returns429() throws Exception {
        when(rateLimiter.isAllowed(anyString())).thenReturn(false);
        String body = objectMapper.writeValueAsString(
                new ContactRequest("Bob", "bob@example.com", "Hi", "Payload body text here"));
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void postContact_disposableEmail_returns422() throws Exception {
        when(rateLimiter.isAllowed(anyString())).thenReturn(true);
        when(emailValidator.validate(anyString()))
                .thenReturn(EmailValidationService.ValidationResult.reject("Disposable addresses not accepted."));
        String body = objectMapper.writeValueAsString(
                new ContactRequest("Eve", "eve@mailinator.com", "Hi", "Payload body text here"));
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Disposable addresses not accepted."));
    }

    @Test
    void validateEmail_validDomain_returns200() throws Exception {
        when(emailValidator.validate("user@gmail.com"))
                .thenReturn(EmailValidationService.ValidationResult.ok());
        mockMvc.perform(get("/api/contact/validate-email").param("email", "user@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void validateEmail_disposableDomain_returns422() throws Exception {
        when(emailValidator.validate("u@mailinator.com"))
                .thenReturn(EmailValidationService.ValidationResult.reject("Disposable not accepted."));
        mockMvc.perform(get("/api/contact/validate-email").param("email", "u@mailinator.com"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false));
    }
}
