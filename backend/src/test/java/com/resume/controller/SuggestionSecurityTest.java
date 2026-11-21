package com.resume.controller;

import com.resume.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The suggestion endpoints behind the real security filter chain (the {@code @WebMvcTest}
 * slices switch filters off). Runs on the {@code test} profile, so it needs no Docker;
 * {@code PostgresSuggestionTest} repeats the check against PostgreSQL.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SuggestionSecurityTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtUtil jwt;

    private static final String BODY =
            "{\"targetType\":\"profile\",\"field\":\"tagline\",\"proposedValue\":\"x\",\"reason\":\"y\"}";

    private static List<MockHttpServletRequestBuilder> everyEndpoint() {
        return List.of(
                get("/api/admin/suggestions"),
                get("/api/admin/suggestions").param("status", "pending"),
                get("/api/admin/suggestions/targets"),
                get("/api/admin/suggestions/1"),
                post("/api/admin/suggestions").contentType(MediaType.APPLICATION_JSON).content(BODY),
                post("/api/admin/suggestions/1/accept"),
                post("/api/admin/suggestions/1/reject"));
    }

    @Test
    void everyEndpoint_refusesARequestWithoutAToken() throws Exception {
        for (MockHttpServletRequestBuilder request : everyEndpoint()) {
            mockMvc.perform(request).andExpect(status().isForbidden());
        }
    }

    @Test
    void everyEndpoint_refusesAForgedOrMalformedToken() throws Exception {
        String forged = new JwtUtil("another-secret-key-min-256-bits-long-bbbbbbbbbbbbbbbbbbbb", 3_600_000L)
                .generate("admin");
        for (String header : List.of("Bearer " + forged, "Bearer not-a-jwt", "Basic YWRtaW46YWRtaW4=")) {
            for (MockHttpServletRequestBuilder request : everyEndpoint()) {
                mockMvc.perform(request.header("Authorization", header)).andExpect(status().isForbidden());
            }
        }
    }

    @Test
    void aValidAdminToken_isLetThrough() throws Exception {
        String token = jwt.generate("admin");

        mockMvc.perform(get("/api/admin/suggestions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        // Reaches the service: an unknown id is a 404 from it, not a 403 from the filter chain.
        mockMvc.perform(post("/api/admin/suggestions/999/reject").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("not_found"));
    }
}
