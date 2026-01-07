# Common Scientific Query Patterns

## Surface Measurements
Surface refers to the upper ocean.
Use:
- pressure < 10 dbar

## Deep Ocean
Deep ocean refers to:
- pressure > 1000 dbar

## Temperature Queries
- Use temp_adjusted
- Average temperature: AVG(temp_adjusted)

## Salinity Queries
- Use psal_adjusted
- Average salinity: AVG(psal_adjusted)

## Regional Queries
- Filter by latitude and longitude from argo_profiles.
- Measurements are linked via profile_id.

## Trend or Change Questions
- Compare averages across time ranges.
- Requires grouping by profile_datetime.
