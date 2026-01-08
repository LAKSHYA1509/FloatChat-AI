# FloatChat Database Schema (Semantic Description)

## argo_profiles
Represents a single Argo float profile (one vertical measurement cycle).

Fields:
- wmo_id: Unique identifier of the Argo float.
- cycle_number: The measurement cycle number for the float.
- profile_datetime: Timestamp when the profile was recorded.
- latitude, longitude: Geographic location of the float.
- data_mode:
  - 'D' = Delayed-mode (expert quality controlled, preferred).
  - 'R' = Real-time (automated QC only, lower reliability).
- source_file: Original NetCDF file name.

## argo_measurements
Contains vertical measurements associated with an Argo profile.

Fields:
- pressure: Pressure in decibars (dbar). Higher pressure = deeper ocean.
- temp_adjusted: Scientifically corrected sea temperature (°C).
- psal_adjusted: Scientifically corrected salinity.
- temp_qc, psal_qc: Quality control flags.

Important rule:
Only *_ADJUSTED variables are scientifically valid for analysis.
