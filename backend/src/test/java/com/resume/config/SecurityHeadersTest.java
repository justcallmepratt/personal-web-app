package com.resume.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Response headers and error statuses behind the real security filter chain. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityHeadersTest {

    @Autowired MockMvc mockMvc;

    @Test
    void sendsHstsAndReferrerPolicyEvenOverPlainHttp() throws Exception {
        // TLS ends at the hosting proxy, so the app itself only ever sees http.
        mockMvc.perform(get("/actuator/health"))
            .andExpect(header().string("Strict-Transport-Security", "max-age=63072000 ; includeSubDomains"))
            .andExpect(header().string("Referrer-Policy", "no-referrer"));
    }

    @Test
    void anUnknownPathIsA404NotA500() throws Exception {
        mockMvc.perform(get("/api/does-not-exist"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Not Found"));
    }

    @Test
    void aWrongMethodIsA405WithItsAllowHeader() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/profile"))
            .andExpect(status().isMethodNotAllowed())
            .andExpect(header().exists("Allow"));
    }

    @Test
    void aBadlyTypedPathVariableIsA400() throws Exception {
        mockMvc.perform(get("/api/projects/abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Invalid request"));
    }
}
