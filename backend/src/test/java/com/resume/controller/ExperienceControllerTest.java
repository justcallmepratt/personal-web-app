package com.resume.controller;

import com.resume.model.Experience;
import com.resume.security.JwtFilter;
import com.resume.security.JwtUtil;
import com.resume.service.ExperienceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ExperienceController.class)
@AutoConfigureMockMvc(addFilters = false)
class ExperienceControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ExperienceService experienceService;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean JwtFilter jwtFilter;

    @Test
    void listExperience_returnsList() throws Exception {
        Experience e = new Experience();
        e.setCompany("Arasaka");
        e.setRole("Senior Engineer");
        e.setStartDate(LocalDate.of(2024, 3, 1));
        e.setCurrent(true);
        when(experienceService.all()).thenReturn(List.of(e));

        mockMvc.perform(get("/api/experience"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].company").value("Arasaka"))
                .andExpect(jsonPath("$[0].role").value("Senior Engineer"));
    }

    @Test
    void listExperience_returnsEmptyList() throws Exception {
        when(experienceService.all()).thenReturn(List.of());
        mockMvc.perform(get("/api/experience"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
