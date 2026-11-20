package com.resume.controller;

import com.resume.model.Project;
import com.resume.security.JwtFilter;
import com.resume.security.JwtUtil;
import com.resume.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProjectControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ProjectService projectService;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean JwtFilter jwtFilter;

    private Project makeProject(Long id, String title, boolean featured) {
        Project p = new Project();
        p.setId(id);
        p.setTitle(title);
        p.setFeatured(featured);
        return p;
    }

    @Test
    void listProjects_returnsList() throws Exception {
        when(projectService.all(false)).thenReturn(List.of(
                makeProject(1L, "Neon Dashboard", false),
                makeProject(2L, "Quickhack CLI", false)
        ));
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Neon Dashboard"));
    }

    @Test
    void listProjects_withFeaturedTrue_returnsFilteredList() throws Exception {
        when(projectService.all(true)).thenReturn(List.of(
                makeProject(1L, "Featured Project", true)
        ));
        mockMvc.perform(get("/api/projects?featured=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].featured").value(true));
    }

    @Test
    void byId_returns200_whenFound() throws Exception {
        when(projectService.byId(1L)).thenReturn(Optional.of(makeProject(1L, "Neon Dashboard", false)));
        mockMvc.perform(get("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Neon Dashboard"));
    }

    @Test
    void byId_returns404_whenNotFound() throws Exception {
        when(projectService.byId(99L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/projects/99"))
                .andExpect(status().isNotFound());
    }
}
