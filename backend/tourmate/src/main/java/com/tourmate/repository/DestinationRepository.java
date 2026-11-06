package com.tourmate.repository;

import com.tourmate.entity.Destination;
import com.tourmate.enums.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DestinationRepository extends JpaRepository<Destination, Long> {
    List<Destination> findByCategory(Category category);
}
