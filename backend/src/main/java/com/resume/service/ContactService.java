package com.resume.service;

import com.resume.dto.ContactRequest;
import com.resume.model.Message;
import com.resume.repository.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService {
    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final MessageRepository repo;
    private final JavaMailSender mailSender;
    private final String mailUser;
    private final String mailTo;

    public ContactService(MessageRepository repo,
                          JavaMailSender mailSender,
                          @Value("${spring.mail.username:}") String mailUser,
                          @Value("${contact.notify-to:}") String mailTo) {
        this.repo = repo;
        this.mailSender = mailSender;
        this.mailUser = mailUser;
        this.mailTo = mailTo;
    }

    /** Strips line breaks so user-supplied text cannot forge extra log entries. */
    private static String oneLine(String s) {
        return s == null ? null : s.replaceAll("[\\r\\n]", "_");
    }

    @Transactional
    public Message handle(ContactRequest req) {
        Message m = new Message();
        m.setName(req.name());
        m.setEmail(req.email());
        m.setSubject(req.subject());
        m.setBody(req.body());
        Message saved = repo.save(m);

        if (mailUser == null || mailUser.isBlank()) {
            log.info("Mail not configured. Inbound contact: from={} <{}> subject={}",
                    oneLine(req.name()), oneLine(req.email()), oneLine(req.subject()));
            return saved;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(mailUser);
            mail.setTo(mailTo == null || mailTo.isBlank() ? mailUser : mailTo);
            mail.setReplyTo(req.email());
            mail.setSubject("[Resume Contact] " + req.subject());
            mail.setText("From: " + req.name() + " <" + req.email() + ">\n\n" + req.body());
            mailSender.send(mail);
        } catch (Exception e) {
            log.warn("Failed to send contact email; message persisted in DB. {}", e.getMessage());
        }
        return saved;
    }
}
