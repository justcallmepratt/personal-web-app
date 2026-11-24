package com.resume.service;

import com.resume.dto.ContactRequest;
import com.resume.model.Message;
import com.resume.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock private MessageRepository messageRepository;
    @Mock private JavaMailSender mailSender;

    private ContactRequest makeRequest() {
        return new ContactRequest("Alice", "alice@example.com", "Hello", "World");
    }

    private ContactService serviceWith(String mailUser) {
        return new ContactService(messageRepository, mailSender, mailUser, "admin@example.com");
    }

    @Test
    void handle_savesMessage_andReturns_whenMailNotConfigured() {
        ContactService service = serviceWith("");
        Message saved = new Message();
        saved.setName("Alice");
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        Message result = service.handle(makeRequest());

        assertThat(result.getName()).isEqualTo("Alice");
        verify(messageRepository).save(any(Message.class));
        verifyNoInteractions(mailSender);
    }

    @Test
    void handle_savesMessage_andSendsEmail_whenMailUserSet() {
        ContactService service = serviceWith("noreply@example.com");
        Message saved = new Message();
        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        service.handle(makeRequest());

        verify(messageRepository).save(any(Message.class));
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getSubject()).contains("Resume Contact");
    }

    @Test
    void handle_logsWarning_doesNotThrow_whenMailSenderFails() {
        ContactService service = serviceWith("noreply@example.com");
        Message saved = new Message();
        when(messageRepository.save(any(Message.class))).thenReturn(saved);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(SimpleMailMessage.class));

        // Should not throw
        Message result = service.handle(makeRequest());

        assertThat(result).isNotNull();
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    void handle_flattensLineBreaksInTheSubject_soNoHeaderCanBeAdded() {
        ContactService service = serviceWith("noreply@example.com");
        when(messageRepository.save(any(Message.class))).thenReturn(new Message());

        service.handle(new ContactRequest("Alice", "alice@example.com", "Hi\r\nBcc: victim@example.com", "World"));

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getSubject())
            .isEqualTo("[Resume Contact] Hi Bcc: victim@example.com")
            .doesNotContain("\r").doesNotContain("\n");
    }
}
