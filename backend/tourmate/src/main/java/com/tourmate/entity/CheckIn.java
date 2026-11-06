package com.tourmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** A visitor group arriving at a destination; recent check-ins feed the live crowd estimate. */
@Entity
@Table(name = "check_ins")
@Getter
@Setter
@NoArgsConstructor
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    private int groupSize = 1;

    private LocalDateTime createdAt = LocalDateTime.now();

    public CheckIn(Destination destination, int groupSize) {
        this.destination = destination;
        this.groupSize = groupSize;
    }
}
