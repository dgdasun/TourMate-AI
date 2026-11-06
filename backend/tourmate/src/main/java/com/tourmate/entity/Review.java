package com.tourmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    private String visitorName;
    private String country;
    private int rating;

    @Column(length = 2000)
    private String comment;

    /** -1.0 (very negative) .. 1.0 (very positive). */
    private double sentimentScore;

    private String sentimentLabel;

    /** Comma separated aspects the review talks about, e.g. "cleanliness,crowds". */
    private String aspects;

    private LocalDateTime createdAt = LocalDateTime.now();
}
