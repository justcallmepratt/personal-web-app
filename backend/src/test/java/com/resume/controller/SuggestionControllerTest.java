package com.resume.controller;

import com.resume.dto.SuggestionRequest;
import com.resume.dto.SuggestionResponse;
import com.resume.dto.SuggestionTarget;
import com.resume.security.JwtFilter;
import com.resume.security.JwtUtil;
import com.resume.service.SuggestionException;
import com.resume.service.SuggestionService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SuggestionController.class)
@AutoConfigureMockMvc(addFilters = false)
class SuggestionControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean SuggestionService service;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean JwtFilter jwtFilter;

    private static SuggestionResponse response(long id, String status) {
        return new SuggestionResponse(id, "experience", 7L, "Engineer at Acme", "role", "text",
                "Engineer", "Senior Engineer", "Promoted", "manual", status,
                LocalDateTime.of(2026, 11, 21, 10, 15, 30),
                "pending".equals(status) ? null : LocalDateTime.of(2026, 11, 21, 11, 0, 0));
    }

    @Test
    void list_returnsSuggestions_andPassesTheStatusFilterOn() throws Exception {
        when(service.list("pending")).thenReturn(List.of(response(2, "pending")));

        mockMvc.perform(get("/api/admin/suggestions").param("status", "pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].targetType").value("experience"))
                .andExpect(jsonPath("$[0].targetId").value(7))
                .andExpect(jsonPath("$[0].targetLabel").value("Engineer at Acme"))
                .andExpect(jsonPath("$[0].field").value("role"))
                .andExpect(jsonPath("$[0].fieldKind").value("text"))
                .andExpect(jsonPath("$[0].currentValue").value("Engineer"))
                .andExpect(jsonPath("$[0].proposedValue").value("Senior Engineer"))
                .andExpect(jsonPath("$[0].reason").value("Promoted"))
                .andExpect(jsonPath("$[0].source").value("manual"))
                .andExpect(jsonPath("$[0].status").value("pending"))
                .andExpect(jsonPath("$[0].createdAt").value("2026-11-21T10:15:30"))
                .andExpect(jsonPath("$[0].decidedAt").value(nullValue()));
    }

    @Test
    void list_withoutAStatus_asksForEverything() throws Exception {
        when(service.list(null)).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/suggestions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void list_withAnUnknownStatus_returns400() throws Exception {
        when(service.list("approved")).thenThrow(SuggestionException.invalid("Unknown status."));

        mockMvc.perform(get("/api/admin/suggestions").param("status", "approved"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("invalid"))
                .andExpect(jsonPath("$.error").value("Unknown status."))
                .andExpect(jsonPath("$", not(hasKey("currentValue"))));
    }

    @Test
    void targets_returnsTheChangeableFields() throws Exception {
        when(service.targets()).thenReturn(List.of(new SuggestionTarget("project", 3L, "Site", List.of(
                new SuggestionTarget.Field("title", "text", true, 255, "Site"),
                new SuggestionTarget.Field("tags", "list", true, 255, List.of("web"))))));

        mockMvc.perform(get("/api/admin/suggestions/targets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].targetType").value("project"))
                .andExpect(jsonPath("$[0].targetId").value(3))
                .andExpect(jsonPath("$[0].label").value("Site"))
                .andExpect(jsonPath("$[0].fields[0].name").value("title"))
                .andExpect(jsonPath("$[0].fields[0].required").value(true))
                .andExpect(jsonPath("$[0].fields[0].maxLength").value(255))
                .andExpect(jsonPath("$[0].fields[1].kind").value("list"))
                .andExpect(jsonPath("$[0].fields[1].value[0]").value("web"));
    }

    @Test
    void get_returnsOne_or404() throws Exception {
        when(service.get(2L)).thenReturn(response(2, "accepted"));
        when(service.get(9L)).thenThrow(SuggestionException.notFound("That suggestion does not exist."));

        mockMvc.perform(get("/api/admin/suggestions/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("accepted"))
                .andExpect(jsonPath("$.decidedAt").value("2026-11-21T11:00:00"));
        mockMvc.perform(get("/api/admin/suggestions/9"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("not_found"));
    }

    @Test
    void get_withAnIdThatIsNotANumber_returns400() throws Exception {
        mockMvc.perform(get("/api/admin/suggestions/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("invalid"));
        verifyNoInteractions(service);
    }

    @Test
    void create_returns201_andHandsTheBodyToTheService() throws Exception {
        when(service.create(any())).thenReturn(response(2, "pending"));

        mockMvc.perform(post("/api/admin/suggestions").contentType(MediaType.APPLICATION_JSON).content("""
                        {"targetType":"experience","targetId":7,"field":"highlights",
                         "proposedValue":["Shipped X","Led Y"],"reason":"New work","source":"manual"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.status").value("pending"));

        ArgumentCaptor<SuggestionRequest> sent = ArgumentCaptor.forClass(SuggestionRequest.class);
        verify(service).create(sent.capture());
        assertThat(sent.getValue().targetType()).isEqualTo("experience");
        assertThat(sent.getValue().targetId()).isEqualTo(7L);
        assertThat(sent.getValue().field()).isEqualTo("highlights");
        assertThat(sent.getValue().proposedValue()).isEqualTo(List.of("Shipped X", "Led Y"));
        assertThat(sent.getValue().reason()).isEqualTo("New work");
        assertThat(sent.getValue().source()).isEqualTo("manual");
    }

    @Test
    void create_withATextValue_andNoOptionalFields() throws Exception {
        when(service.create(any())).thenReturn(response(2, "pending"));

        mockMvc.perform(post("/api/admin/suggestions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetType\":\"profile\",\"field\":\"tagline\",\"proposedValue\":\"Engineer\"}"))
                .andExpect(status().isCreated());

        ArgumentCaptor<SuggestionRequest> sent = ArgumentCaptor.forClass(SuggestionRequest.class);
        verify(service).create(sent.capture());
        assertThat(sent.getValue().targetId()).isNull();
        assertThat(sent.getValue().proposedValue()).isEqualTo("Engineer");
        assertThat(sent.getValue().reason()).isNull();
        assertThat(sent.getValue().source()).isNull();
    }

    @Test
    void create_withABodyThatIsNotJson_returns400_not500() throws Exception {
        mockMvc.perform(post("/api/admin/suggestions").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("invalid"))
                .andExpect(jsonPath("$.error").value("The request could not be read."));
        verifyNoInteractions(service);
    }

    @Test
    void create_passesOnValidationAndDuplicateRefusals() throws Exception {
        when(service.create(any()))
                .thenThrow(SuggestionException.invalid("A reason is required."))
                .thenThrow(SuggestionException.refused("duplicate", "The same change is already waiting for a decision."));
        String body = "{\"targetType\":\"profile\",\"field\":\"tagline\",\"proposedValue\":\"x\"}";

        mockMvc.perform(post("/api/admin/suggestions").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("A reason is required."));
        mockMvc.perform(post("/api/admin/suggestions").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("duplicate"));
    }

    @Test
    void accept_returnsTheAcceptedSuggestion() throws Exception {
        when(service.accept(2L)).thenReturn(response(2, "accepted"));

        mockMvc.perform(post("/api/admin/suggestions/2/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("accepted"));
    }

    @Test
    void accept_onAConflict_returns409WithTheLiveValue() throws Exception {
        when(service.accept(2L)).thenThrow(SuggestionException.conflict("'role' has changed.", "Lead Engineer"));
        when(service.accept(3L)).thenThrow(SuggestionException.conflict("'tags' has changed.", List.of("web", "java")));
        when(service.accept(4L)).thenThrow(SuggestionException.conflict("'bio' has changed.", null));

        mockMvc.perform(post("/api/admin/suggestions/2/accept"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("conflict"))
                .andExpect(jsonPath("$.error").value("'role' has changed."))
                .andExpect(jsonPath("$.currentValue").value("Lead Engineer"));
        mockMvc.perform(post("/api/admin/suggestions/3/accept"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.currentValue[1]").value("java"));
        // The field was emptied: the key is present and null.
        mockMvc.perform(post("/api/admin/suggestions/4/accept"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$", hasKey("currentValue")))
                .andExpect(jsonPath("$.currentValue").value(nullValue()));
    }

    @Test
    void accept_passesOnTheOtherRefusals() throws Exception {
        when(service.accept(5L)).thenThrow(SuggestionException.refused("not_pending", "This suggestion was already rejected."));
        when(service.accept(6L)).thenThrow(SuggestionException.refused("target_missing", "Gone."));
        when(service.accept(9L)).thenThrow(SuggestionException.notFound("That suggestion does not exist."));

        mockMvc.perform(post("/api/admin/suggestions/5/accept"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("not_pending"))
                .andExpect(jsonPath("$", not(hasKey("currentValue"))));
        mockMvc.perform(post("/api/admin/suggestions/6/accept"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("target_missing"));
        mockMvc.perform(post("/api/admin/suggestions/9/accept"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/admin/suggestions/x/accept"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reject_returnsTheRejectedSuggestion_orTheRefusal() throws Exception {
        when(service.reject(2L)).thenReturn(response(2, "rejected"));
        when(service.reject(5L)).thenThrow(SuggestionException.refused("not_pending", "This suggestion was already accepted."));

        mockMvc.perform(post("/api/admin/suggestions/2/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("rejected"));
        mockMvc.perform(post("/api/admin/suggestions/5/reject"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("not_pending"));
    }
}
