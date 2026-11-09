package com.tourmate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One place in a saved trip: which day, in what order, and the traveller's own note. */
@Entity
@Table(name = "trip_stops")
@Getter
@Setter
@NoArgsConstructor
public class TripStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private TripPlan trip;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    /** 1-based day of the trip. */
    private int dayNumber;

    /** 0-based order within the day. */
    private int position;

    @Column(length = 300)
    private String note;

    public TripStop(TripPlan trip, Destination destination, int dayNumber, int position, String note) {
        this.trip = trip;
        this.destination = destination;
        this.dayNumber = dayNumber;
        this.position = position;
        this.note = note;
    }
}
