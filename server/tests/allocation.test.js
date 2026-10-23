import { calculateHaversineDistanceKm, getTargetCompletionDate } from '../src/services/allocationService.js';

describe('Automatic Worker Allocation Engine', () => {
  test('accurately calculates Haversine distance between two coordinates', () => {
    // Distance between Chennai Central (13.0827, 80.2707) and Egmore (13.0784, 80.2608) is ~1.17 km
    const distance = calculateHaversineDistanceKm(13.0827, 80.2707, 13.0784, 80.2608);
    expect(distance).toBeGreaterThan(0.9);
    expect(distance).toBeLessThan(1.5);
  });

  test('returns 0 for identical coordinates', () => {
    const distance = calculateHaversineDistanceKm(13.0827, 80.2707, 13.0827, 80.2707);
    expect(distance).toBe(0);
  });

  test('handles invalid or undefined coordinates gracefully', () => {
    const distance = calculateHaversineDistanceKm(undefined, NaN, 13.0827, 80.2707);
    expect(distance).toBe(15.0);
  });

  test('calculates correct SLA target completion date based on damage severity', () => {
    const now = new Date();

    const criticalDate = getTargetCompletionDate('Critical');
    const diffHoursCritical = (criticalDate - now) / (1000 * 60 * 60);
    expect(diffHoursCritical).toBeCloseTo(24, 0);

    const highDate = getTargetCompletionDate('High');
    const diffHoursHigh = (highDate - now) / (1000 * 60 * 60);
    expect(diffHoursHigh).toBeCloseTo(48, 0);

    const mediumDate = getTargetCompletionDate('Medium');
    const diffDaysMedium = (mediumDate - now) / (1000 * 60 * 60 * 24);
    expect(diffDaysMedium).toBeCloseTo(7, 0);

    const lowDate = getTargetCompletionDate('Low');
    const diffDaysLow = (lowDate - now) / (1000 * 60 * 60 * 24);
    expect(diffDaysLow).toBeCloseTo(14, 0);
  });
});
