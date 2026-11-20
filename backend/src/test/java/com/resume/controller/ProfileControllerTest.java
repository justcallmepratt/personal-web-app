package com.resume.controller;

import com.resume.model.Profile;
import com.resume.security.JwtFilter;
import com.resume.security.JwtUtil;
import com.resume.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProfileControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ProfileService profileService;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean JwtFilter jwtFilter;

    @Test
    void getProfile_returns200_withProfile() throws Exception {
        Profile p = new Profile();
        p.setName("V");
        p.setTagline("Night City Developer");
        when(profileService.get()).thenReturn(p);

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("V"))
                .andExpect(jsonPath("$.tagline").value("Night City Developer"));
    }

    @Test
    void getProfile_returns404_whenServiceReturnsNull() throws Exception {
        when(profileService.get()).thenReturn(null);

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isNotFound());
    }
}
