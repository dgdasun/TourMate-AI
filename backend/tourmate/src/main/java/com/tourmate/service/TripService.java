package com.tourmate.service;

import com.tourmate.dto.PlanResponse;
import com.tourmate.dto.TripDtos.StopInput;
import com.tourmate.dto.TripDtos.TripDetail;
import com.tourmate.dto.TripDtos.TripRequest;
import com.tourmate.dto.TripDtos.TripSummary;
import com.tourmate.entity.Destination;
import com.tourmate.entity.TripPlan;
import com.tourmate.entity.TripStop;
import com.tourmate.exception.NotFoundException;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.repository.TripPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** A traveller's saved trips. Every operation is scoped to the owner, so nobody can see or edit another person's trip. */
@Service
public class TripService {

    private final TripPlanRepository tripRepository;
    private final DestinationRepository destinationRepository;
    private final PlannerService plannerService;

    public TripService(TripPlanRepository tripRepository, DestinationRepository destinationRepository,
                       PlannerService plannerService) {
        this.tripRepository = tripRepository;
        this.destinationRepository = destinationRepository;
        this.plannerService = plannerService;
    }

    public List<TripSummary> list(Long userId) {
        return tripRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(TripSummary::from).toList();
    }

    @Transactional(readOnly = true)
    public TripDetail get(Long userId, Long tripId) {
        return TripDetail.from(find(userId, tripId));
    }

    @Transactional
    public TripDetail create(Long userId, TripRequest req) {
        TripPlan trip = new TripPlan();
        trip.setUserId(userId);
        apply(trip, req);
        return TripDetail.from(tripRepository.save(trip));
    }

    @Transactional
    public TripDetail update(Long userId, Long tripId, TripRequest req) {
        TripPlan trip = find(userId, tripId);
        apply(trip, req);
        trip.setUpdatedAt(LocalDateTime.now());
        return TripDetail.from(tripRepository.save(trip));
    }

    @Transactional
    public void delete(Long userId, Long tripId) {
        tripRepository.delete(find(userId, tripId));
    }

    private TripPlan find(Long userId, Long tripId) {
        // "not found" rather than "forbidden" so other people's trip ids aren't revealed
        return tripRepository.findByIdAndUserId(tripId, userId)
                .orElseThrow(() -> new NotFoundException("Trip " + tripId + " not found"));
    }

    private void apply(TripPlan trip, TripRequest req) {
        // the evaluation validates every destination id and gives the summary numbers we store
        PlanResponse plan = plannerService.evaluate(req.dayIds(), req.month(), req.interests(), req.budget(),
                req.transport(), req.travellers());
        Map<Long, Destination> byId = destinationRepository.findAllById(req.dayIds().stream().flatMap(List::stream).toList())
                .stream().collect(Collectors.toMap(Destination::getId, Function.identity()));

        trip.setTitle(req.title().trim());
        trip.setNotes(req.notes() == null || req.notes().isBlank() ? null : req.notes().trim());
        trip.setDays(req.days().size());
        trip.setTravelMonth(req.month());
        trip.setTravellers(req.travellers());
        trip.setBudget(req.budget().name());
        trip.setTransport(req.transport().name());
        trip.setInterests(req.interests() == null ? null
                : req.interests().stream().map(Enum::name).collect(Collectors.joining(",")));
        trip.setDestinations(plan.itinerary().stream().flatMap(d -> d.stops().stream())
                .map(PlanResponse.Stop::name).collect(Collectors.joining(", ")));
        trip.setTotalCostUsd(plan.cost().total());
        trip.setCarbonKg(plan.carbonKg());

        trip.getStops().clear();
        for (int day = 0; day < req.days().size(); day++) {
            List<StopInput> stops = req.days().get(day);
            for (int pos = 0; pos < stops.size(); pos++) {
                StopInput s = stops.get(pos);
                String note = s.note() == null || s.note().isBlank() ? null : s.note().trim();
                trip.getStops().add(new TripStop(trip, byId.get(s.destinationId()), day + 1, pos, note));
            }
        }
    }
}
