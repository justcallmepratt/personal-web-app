package com.resume.controller;

import tools.jackson.databind.ObjectMapper;
import com.resume.model.Message;
import com.resume.repository.MessageRepository;
import com.resume.security.JwtFilter;
import com.resume.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "admin.username=admin",
        "admin.password-hash=$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lLxKQZK.",
        "jwt.secret=test-secret-key-min-256-bits-long-aaaaaaaaaaaaaaaaaaa",
        "jwt.expiry-ms=3600000"
})
class AdminControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean MessageRepository messageRepository;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean JwtFilter jwtFilter;
    @MockitoBean PasswordEncoder passwordEncoder;

    @Test
    void login_withCorrectCredentials_returnsToken() throws Exception {
        when(passwordEncoder.matches(eq("secret"), any())).thenReturn(true);
        when(jwtUtil.generate("admin")).thenReturn("generated-jwt-token");

        String body = objectMapper.writeValueAsString(Map.of("username", "admin", "password", "secret"));

        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("generated-jwt-token"));
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        String body = objectMapper.writeValueAsString(Map.of("username", "admin", "password", "wrongpass"));

        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withWrongUsername_returns401() throws Exception {
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        String body = objectMapper.writeValueAsString(Map.of("username", "baduser", "password", "secret"));

        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMessages_returnsList() throws Exception {
        Message m = new Message();
        m.setName("Alice");
        m.setSubject("Hello");
        when(messageRepository.findAllByOrderBySentAtDesc()).thenReturn(List.of(m));

        mockMvc.perform(get("/api/admin/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Alice"));
    }

    @Test
    void markRead_togglesReadStatus() throws Exception {
        Message m = new Message();
        m.setRead(false);
        m.setName("Bob");
        when(messageRepository.findById(1L)).thenReturn(Optional.of(m));
        Message toggled = new Message();
        toggled.setRead(true);
        toggled.setName("Bob");
        when(messageRepository.save(any())).thenReturn(toggled);

        mockMvc.perform(patch("/api/admin/messages/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    void markRead_returns404_whenNotFound() throws Exception {
        when(messageRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/admin/messages/99/read"))
                .andExpect(status().isNotFound());
    }
}
