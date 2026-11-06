package com.tourmate.service;

import com.tourmate.dto.DestinationDto;
import com.tourmate.dto.DestinationRequest;
import com.tourmate.entity.Destination;
import com.tourmate.enums.Category;
import com.tourmate.exception.NotFoundException;
import com.tourmate.repository.CheckInRepository;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.repository.ReviewRepository;
import com.tourmate.repository.VisitStatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final ReviewRepository reviewRepository;
    private final CheckInRepository checkInRepository;
    private final VisitStatRepository visitStatRepository;
    private final ForecastService forecastService;

    public DestinationService(DestinationRepository destinationRepository, ReviewRepository reviewRepository,
                              CheckInRepository checkInRepository, VisitStatRepository visitStatRepository,
                              ForecastService forecastService) {
        this.destinationRepository = destinationRepository;
        this.reviewRepository = reviewRepository;
        this.checkInRepository = checkInRepository;
        this.visitStatRepository = visitStatRepository;
        this.forecastService = forecastService;
    }

    public List<DestinationDto> list(Category category, Integer month, String search) {
        int m = month != null ? month : LocalDate.now().getMonthValue();
        List<Destination> all = category == null ? destinationRepository.findAll() : destinationRepository.findByCategory(category);
        String q = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return all.stream()
                .filter(d -> q.isEmpty() || d.getName().toLowerCase(Locale.ROOT).contains(q)
                        || d.getProvince().toLowerCase(Locale.ROOT).contains(q)
                        || (d.getTags() != null && d.getTags().toLowerCase(Locale.ROOT).contains(q)))
                .map(d -> DestinationDto.from(d, m))
                .sorted(Comparator.comparingDouble(DestinationDto::weatherScore).reversed().thenComparing(DestinationDto::name))
                .toList();
    }

    public DestinationDto get(Long id) {
        return DestinationDto.from(find(id), LocalDate.now().getMonthValue());
    }

    public DestinationDto create(DestinationRequest req) {
        Destination d = new Destination();
        apply(d, req);
        return DestinationDto.from(destinationRepository.save(d), LocalDate.now().getMonthValue());
    }

    public DestinationDto update(Long id, DestinationRequest req) {
        Destination d = find(id);
        apply(d, req);
        forecastService.invalidate(id);
        return DestinationDto.from(destinationRepository.save(d), LocalDate.now().getMonthValue());
    }

    @Transactional
    public void delete(Long id) {
        Destination d = find(id);
        reviewRepository.deleteByDestinationId(id);
        checkInRepository.deleteByDestinationId(id);
        visitStatRepository.deleteByDestinationId(id);
        destinationRepository.delete(d);
        forecastService.invalidate(id);
    }

    private Destination find(Long id) {
        return destinationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Destination " + id + " not found"));
    }

    private static void apply(Destination d, DestinationRequest req) {
        d.setName(req.name());
        d.setProvince(req.province());
        d.setCategory(req.category());
        d.setClimateZone(req.climateZone());
        d.setDescription(req.description());
        d.setLatitude(req.latitude());
        d.setLongitude(req.longitude());
        d.setEntryFeeUsd(req.entryFeeUsd());
        d.setAvgVisitHours(req.avgVisitHours());
        d.setDailyCapacity(req.dailyCapacity());
        d.setEcoScore(req.ecoScore());
        d.setTags(req.tags());
    }
}
