package com.tourmate.service;

import com.tourmate.dto.ForecastResponse;
import com.tourmate.entity.Destination;
import com.tourmate.entity.VisitStat;
import com.tourmate.exception.NotFoundException;
import com.tourmate.repository.DestinationRepository;
import com.tourmate.repository.VisitStatRepository;
import com.tourmate.util.GeoUtil;
import org.springframework.stereotype.Service;

import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Predicts monthly visitor demand with a classic multiplicative time-series decomposition:
 * <ol>
 *   <li>fit a rough linear trend to the raw history,</li>
 *   <li>average each calendar month's ratio to that trend to get 12 seasonal indices,</li>
 *   <li>remove seasonality and fit the final linear trend by least squares,</li>
 *   <li>forecast = trend(t) x seasonalIndex(month).</li>
 * </ol>
 * It is transparent and explainable to destination managers, and works with as little as 2 years of data.
 */
@Service
public class ForecastService {

    private static final int FORECAST_MONTHS = 12;

    private final VisitStatRepository visitStatRepository;
    private final DestinationRepository destinationRepository;
    private final Map<Long, Model> cache = new ConcurrentHashMap<>();

    public ForecastService(VisitStatRepository visitStatRepository, DestinationRepository destinationRepository) {
        this.visitStatRepository = visitStatRepository;
        this.destinationRepository = destinationRepository;
    }

    /** Fitted model for one destination. t = 0 is the first month of history. */
    record Model(YearMonth start, List<VisitStat> history, double intercept, double slope, double[] seasonal) {

        double predict(int t, int month) {
            return Math.max(0, (intercept + slope * t) * seasonal[month - 1]);
        }

        double predict(YearMonth ym) {
            return predict((int) start.until(ym, ChronoUnit.MONTHS), ym.getMonthValue());
        }
    }

    public ForecastResponse forecast(Long destinationId) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new NotFoundException("Destination " + destinationId + " not found"));
        Model model = model(destinationId)
                .orElseThrow(() -> new NotFoundException("No visitor history for " + destination.getName()));

        List<ForecastResponse.Point> points = new ArrayList<>();
        double absPctError = 0;
        List<VisitStat> history = model.history();
        for (int t = 0; t < history.size(); t++) {
            VisitStat s = history.get(t);
            int fitted = (int) Math.round(model.predict(t, s.getStatMonth()));
            absPctError += Math.abs(s.getVisitors() - fitted) / (double) Math.max(1, s.getVisitors());
            points.add(new ForecastResponse.Point(period(s.getStatYear(), s.getStatMonth()),
                    s.getStatYear(), s.getStatMonth(), s.getVisitors(), fitted, null));
        }

        YearMonth next = model.start().plusMonths(history.size());
        int peakMonth = 1;
        int quietMonth = 1;
        double peak = -1;
        double quiet = Double.MAX_VALUE;
        double nextYearTotal = 0;
        for (int i = 0; i < FORECAST_MONTHS; i++) {
            YearMonth ym = next.plusMonths(i);
            double value = model.predict(history.size() + i, ym.getMonthValue());
            nextYearTotal += value;
            if (value > peak) {
                peak = value;
                peakMonth = ym.getMonthValue();
            }
            if (value < quiet) {
                quiet = value;
                quietMonth = ym.getMonthValue();
            }
            points.add(new ForecastResponse.Point(period(ym.getYear(), ym.getMonthValue()),
                    ym.getYear(), ym.getMonthValue(), null, null, (int) Math.round(value)));
        }

        double meanLevel = model.intercept() + model.slope() * (history.size() - 1) / 2.0;
        double growthPct = meanLevel <= 0 ? 0 : model.slope() * 12 / meanLevel * 100;
        double mape = absPctError / history.size() * 100;

        String insight = String.format(Locale.ENGLISH,
                "%s is expected to receive about %,d visitors over the next 12 months (%s%.1f%% underlying annual growth). "
                        + "Demand peaks in %s - plan extra staff, shuttle services and crowd control then. "
                        + "%s is the quietest month: a good window for maintenance and off-season promotions.",
                destination.getName(), Math.round(nextYearTotal), growthPct >= 0 ? "+" : "", growthPct,
                monthName(peakMonth), monthName(quietMonth));

        return new ForecastResponse(destinationId, destination.getName(), points,
                GeoUtil.round(growthPct, 1), GeoUtil.round(mape, 1), monthName(peakMonth), monthName(quietMonth), insight);
    }

    /** Expected visitors for a destination in a given month, or the fallback if there is no history. */
    public double expectedMonthlyVisitors(Destination destination, YearMonth ym) {
        return model(destination.getId())
                .map(m -> m.predict(ym))
                .orElse(destination.getDailyCapacity() * 30 * 0.5);
    }

    /** Drop cached models, e.g. after new visitor statistics are loaded. */
    public void invalidate(Long destinationId) {
        cache.remove(destinationId);
    }

    private Optional<Model> model(Long destinationId) {
        Model cached = cache.get(destinationId);
        if (cached != null) {
            return Optional.of(cached);
        }
        List<VisitStat> history = visitStatRepository.findByDestinationIdOrderByStatYearAscStatMonthAsc(destinationId);
        if (history.size() < 12) {
            return Optional.empty();
        }
        Model model = fit(history);
        cache.put(destinationId, model);
        return Optional.of(model);
    }

    static Model fit(List<VisitStat> history) {
        int n = history.size();
        double[] y = new double[n];
        int[] months = new int[n];
        for (int t = 0; t < n; t++) {
            y[t] = history.get(t).getVisitors();
            months[t] = history.get(t).getStatMonth();
        }

        // 1. rough trend on raw data
        double[] rough = linearFit(y);

        // 2. seasonal indices = average ratio of actual to trend for each calendar month
        double[] sum = new double[12];
        int[] count = new int[12];
        for (int t = 0; t < n; t++) {
            double trend = rough[0] + rough[1] * t;
            if (trend > 0) {
                sum[months[t] - 1] += y[t] / trend;
                count[months[t] - 1]++;
            }
        }
        double[] seasonal = new double[12];
        double mean = 0;
        for (int m = 0; m < 12; m++) {
            seasonal[m] = count[m] == 0 ? 1 : sum[m] / count[m];
            mean += seasonal[m] / 12;
        }
        for (int m = 0; m < 12; m++) {
            seasonal[m] /= mean; // normalise so indices average to 1
        }

        // 3. final trend on de-seasonalised data
        double[] deseasonalised = new double[n];
        for (int t = 0; t < n; t++) {
            deseasonalised[t] = y[t] / seasonal[months[t] - 1];
        }
        double[] trend = linearFit(deseasonalised);

        YearMonth start = YearMonth.of(history.get(0).getStatYear(), history.get(0).getStatMonth());
        return new Model(start, history, trend[0], trend[1], seasonal);
    }

    /** Ordinary least squares y = a + b*t; returns {a, b}. */
    private static double[] linearFit(double[] y) {
        int n = y.length;
        double meanT = (n - 1) / 2.0;
        double meanY = 0;
        for (double v : y) {
            meanY += v / n;
        }
        double num = 0;
        double den = 0;
        for (int t = 0; t < n; t++) {
            num += (t - meanT) * (y[t] - meanY);
            den += (t - meanT) * (t - meanT);
        }
        double slope = den == 0 ? 0 : num / den;
        return new double[]{meanY - slope * meanT, slope};
    }

    static String period(int year, int month) {
        return Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + year;
    }

    static String monthName(int month) {
        return Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }
}
