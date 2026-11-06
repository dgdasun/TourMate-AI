package com.tourmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Monthly visitor count for a destination: the history the demand forecast learns from. */
@Entity
@Table(name = "visit_stats")
@Getter
@Setter
@NoArgsConstructor
public class VisitStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    private int statYear;
    private int statMonth;
    private int visitors;

    public VisitStat(Destination destination, int statYear, int statMonth, int visitors) {
        this.destination = destination;
        this.statYear = statYear;
        this.statMonth = statMonth;
        this.visitors = visitors;
    }
}
