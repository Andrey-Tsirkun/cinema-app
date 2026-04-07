'use client';

import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ApiError, cinemaApi } from '@/lib/cinema-api';
import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  HallPublic,
  SessionPublic,
  SessionSeatWithAvailability,
} from '@/lib/cinema-types';
import styles from './booking.module.scss';

function formatLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function rowLetter(row: number): string {
  if (row >= 1 && row <= 26) {
    return String.fromCharCode(64 + row);
  }
  return `R${row}`;
}

function seatDescription(row: number, number: number, status: SessionSeatWithAvailability['status']): string {
  const pos = `Row ${rowLetter(row)}, seat ${number}`;
  if (status === 'BOOKED') {
    return `${pos}, reserved`;
  }
  return `${pos}, available`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatPriceDisplay(price: string | number): string {
  const n = Number(price);
  if (Number.isNaN(n)) {
    return String(price);
  }
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function buildRowCells(
  rowSeats: SessionSeatWithAvailability[],
  seatsPerRow: number,
): (SessionSeatWithAvailability | null)[] {
  const cells: (SessionSeatWithAvailability | null)[] = [];
  for (let n = 1; n <= seatsPerRow; n++) {
    cells.push(rowSeats.find((s) => s.number === n) ?? null);
  }
  return cells;
}

function groupSeatsByRow(seats: SessionSeatWithAvailability[]): Map<number, SessionSeatWithAvailability[]> {
  const map = new Map<number, SessionSeatWithAvailability[]>();
  for (const s of seats) {
    const list = map.get(s.row) ?? [];
    list.push(s);
    map.set(s.row, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.number - b.number);
  }
  return map;
}

const DATE_STRIP_DAYS = 7;

export function BookingClient() {
  const movieFieldId = useId();
  const hallGroupId = useId();
  const dateGroupId = useId();
  const timeGroupId = useId();
  const seatMapLabelId = useId();

  const [halls, setHalls] = useState<HallPublic[]>([]);
  const [hallsError, setHallsError] = useState<string | null>(null);
  const [hallsLoading, setHallsLoading] = useState(true);

  const [sessions, setSessions] = useState<SessionPublic[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [seats, setSeats] = useState<SessionSeatWithAvailability[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState<string | null>(null);

  const [selectedDateKey, setSelectedDateKey] = useState(() => formatLocalDateKey(new Date()));
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const prevMovieIdRef = useRef<string | null>(null);

  const dateStrip = useMemo(() => {
    const base = new Date();
    return Array.from({ length: DATE_STRIP_DAYS }, (_, i) => addDays(base, i));
  }, []);

  const selectedHall = useMemo(
    () => halls.find((h) => h.id === selectedHallId) ?? null,
    [halls, selectedHallId],
  );

  const movies = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const s of sessions) {
      map.set(s.movie.id, { id: s.movie.id, title: s.movie.title });
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!selectedMovieId) {
      return sessions;
    }
    return sessions.filter((s) => s.movie.id === selectedMovieId);
  }, [sessions, selectedMovieId]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  const selectedSeat = useMemo(
    () => seats.find((s) => s.id === selectedSeatId) ?? null,
    [seats, selectedSeatId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHallsLoading(true);
      setHallsError(null);
      try {
        const data = await cinemaApi.getHalls();
        if (cancelled) return;
        setHalls(data);
        setSelectedHallId((prev) => {
          if (prev && data.some((h) => h.id === prev)) return prev;
          return data[0]?.id ?? null;
        });
      } catch (e) {
        if (!cancelled) {
          setHallsError(e instanceof ApiError ? e.message : 'Failed to load halls');
        }
      } finally {
        if (!cancelled) setHallsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedHallId) {
      setSessions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSessionsLoading(true);
      setSessionsError(null);
      setBannerError(null);
      setBannerSuccess(null);
      try {
        const data = await cinemaApi.getSessions({ date: selectedDateKey, hallId: selectedHallId });
        if (cancelled) return;
        setSessions(data);
        setSelectedSessionId(null);
        setSelectedSeatId(null);
        setSeats([]);
      } catch (e) {
        if (!cancelled) {
          setSessions([]);
          setSessionsError(e instanceof ApiError ? e.message : 'Failed to load sessions');
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedHallId, selectedDateKey]);

  useEffect(() => {
    if (movies.length === 0) {
      setSelectedMovieId(null);
      return;
    }
    setSelectedMovieId((prev) => {
      if (prev && movies.some((m) => m.id === prev)) return prev;
      return movies[0]!.id;
    });
  }, [movies]);

  useEffect(() => {
    if (selectedMovieId === null) {
      prevMovieIdRef.current = null;
      return;
    }
    if (prevMovieIdRef.current === null) {
      prevMovieIdRef.current = selectedMovieId;
      return;
    }
    if (prevMovieIdRef.current === selectedMovieId) {
      return;
    }
    prevMovieIdRef.current = selectedMovieId;
    setSelectedSessionId(null);
    setSelectedSeatId(null);
    setSeats([]);
    setSeatsError(null);
  }, [selectedMovieId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSeats([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSeatsLoading(true);
      setSeatsError(null);
      setBannerError(null);
      setBannerSuccess(null);
      try {
        const data = await cinemaApi.getSessionSeats(selectedSessionId);
        if (cancelled) return;
        setSeats(data);
        setSelectedSeatId(null);
      } catch (e) {
        if (!cancelled) {
          setSeats([]);
          setSeatsError(e instanceof ApiError ? e.message : 'Failed to load seats');
        }
      } finally {
        if (!cancelled) setSeatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  const seatsByRow = useMemo(() => groupSeatsByRow(seats), [seats]);
  const seatRows = useMemo(
    () => [...seatsByRow.entries()].sort((a, b) => a[0] - b[0]),
    [seatsByRow],
  );

  const seatsPerRow = selectedHall?.seatsPerRow ?? 10;

  const toggleSeat = useCallback(
    (seat: SessionSeatWithAvailability) => {
      if (seat.status === 'BOOKED') return;
      setBannerError(null);
      setBannerSuccess(null);
      setSelectedSeatId((prev) => (prev === seat.id ? null : seat.id));
    },
    [],
  );

  const handleCheckout = useCallback(async () => {
    if (!selectedSessionId || !selectedSeatId) return;
    setCheckoutLoading(true);
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const created = await cinemaApi.createReservation({
        sessionId: selectedSessionId,
        seatId: selectedSeatId,
      });
      await cinemaApi.confirmReservation(created.id);
      setBannerSuccess('Booking confirmed. Enjoy the show.');
      setSelectedSeatId(null);
      const nextSeats = await cinemaApi.getSessionSeats(selectedSessionId);
      setSeats(nextSeats);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setBannerError('Please sign in to complete your booking.');
        } else {
          setBannerError(e.message);
        }
      } else {
        setBannerError('Something went wrong. Please try again.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  }, [selectedSessionId, selectedSeatId]);

  const summarySeatLabel =
    selectedSeat && selectedSession
      ? `${rowLetter(selectedSeat.row)}${selectedSeat.number}`
      : '—';

  const summaryPrice =
    selectedSession && selectedSeat ? formatPriceDisplay(selectedSession.price) : '—';

  return (
    <div className={styles.page}>
      <a href="#booking-main" className={styles.skipLink}>
        Skip to booking content
      </a>

      <SiteHeader activeNav="cinemas" />

      <main id="booking-main" className={styles.main} tabIndex={-1}>
        <p className={styles.statusRegion} role="status" aria-live="polite" aria-atomic="true">
          {bannerError ? <span className={styles.statusError}>{bannerError}</span> : null}
          {!bannerError && bannerSuccess ? <span className={styles.statusSuccess}>{bannerSuccess}</span> : null}
        </p>

        {hallsLoading ? <p className={styles.loading}>Loading halls…</p> : null}
        {hallsError ? (
          <p className={styles.statusError} role="alert">
            {hallsError}
          </p>
        ) : null}

        {!hallsLoading && !hallsError && halls.length === 0 ? (
          <p className={styles.muted}>No halls are available yet.</p>
        ) : null}

        {halls.length > 0 ? (
          <div className={styles.grid}>
            <aside className={styles.aside} aria-label="Booking options">
              <div>
                <h1 className={styles.heroTitle}>
                  Book your <br />
                  <span className={styles.heroAccent}>experience</span>
                </h1>
                <p className={styles.heroLead}>
                  Select your journey through space and time with our ultra-immersive hall setups.
                </p>
              </div>

              <div className={styles.controls}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={movieFieldId}>
                    Select movie
                  </label>
                  <div className={styles.selectWrap}>
                    <select
                      id={movieFieldId}
                      className={styles.select}
                      value={selectedMovieId ?? ''}
                      onChange={(ev) => setSelectedMovieId(ev.target.value || null)}
                      disabled={movies.length === 0 || sessionsLoading}
                    >
                      {movies.length === 0 ? <option value="">No movies for this date</option> : null}
                      {movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                    <span className={styles.selectIcon} aria-hidden="true">
                      ▾
                    </span>
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel} id={hallGroupId}>
                    Choose hall
                  </div>
                  <div className={styles.hallGroup} role="group" aria-labelledby={hallGroupId}>
                    {halls.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        className={`${styles.hallBtn} ${selectedHallId === h.id ? styles.hallBtnActive : ''}`}
                        aria-pressed={selectedHallId === h.id}
                        onClick={() => setSelectedHallId(h.id)}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel} id={dateGroupId}>
                    Date
                  </div>
                  <div className={styles.dateRow} role="group" aria-labelledby={dateGroupId}>
                    {dateStrip.map((d) => {
                      const key = formatLocalDateKey(d);
                      const isActive = key === selectedDateKey;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`${styles.dateBtn} ${isActive ? styles.dateBtnActive : ''}`}
                          aria-pressed={isActive}
                          onClick={() => setSelectedDateKey(key)}
                        >
                          <span className={styles.dateMonth}>
                            {d.toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                          <span className={styles.dateDay}>{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel} id={timeGroupId}>
                    Time slot
                  </div>
                  {sessionsLoading ? <p className={styles.loading}>Loading showtimes…</p> : null}
                  {sessionsError ? (
                    <p className={styles.statusError} role="alert">
                      {sessionsError}
                    </p>
                  ) : null}
                  {!sessionsLoading && !sessionsError && filteredSessions.length === 0 ? (
                    <p className={styles.muted}>No sessions for this selection.</p>
                  ) : null}
                  <div className={styles.timeGrid} role="group" aria-labelledby={timeGroupId}>
                    {filteredSessions.map((s) => {
                      const active = s.id === selectedSessionId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`${styles.timeBtn} ${active ? styles.timeBtnActive : ''}`}
                          aria-pressed={active}
                          onClick={() => setSelectedSessionId(s.id)}
                        >
                          {formatTime(s.startTime)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            <section className={styles.section} aria-labelledby={seatMapLabelId}>
              <h2 id={seatMapLabelId} className={styles.seatMapHeading}>
                Seat map
              </h2>

              <div className={styles.mapPanel}>
                <div className={styles.screenWrap} aria-hidden="true">
                  <div className={styles.screenGlow} />
                  <div className={styles.screenCurve} />
                  <p className={styles.screenLabel}>Screen</p>
                </div>

                {seatsLoading ? <p className={styles.loading}>Loading seat map…</p> : null}
                {seatsError ? (
                  <p className={styles.statusError} role="alert">
                    {seatsError}
                  </p>
                ) : null}

                {!seatsLoading && !seatsError && selectedSessionId && seats.length === 0 ? (
                  <p className={styles.muted}>No seats found for this hall.</p>
                ) : null}

                {!selectedSessionId ? (
                  <p className={styles.muted}>Pick a time slot to see the seat map.</p>
                ) : null}

                {selectedSessionId && seats.length > 0 ? (
                  <div className={styles.seatMapSection}>
                    <div className={styles.seatRows}>
                      {seatRows.map(([row, rowSeats]) => (
                        <div
                          key={row}
                          className={styles.seatRow}
                          style={{ ['--seat-cols' as string]: seatsPerRow }}
                          role="group"
                          aria-label={`Row ${rowLetter(row)}`}
                        >
                          {buildRowCells(rowSeats, seatsPerRow).map((cell, idx) => {
                            if (!cell) {
                              return (
                                <span
                                  key={`gap-${row}-${idx}`}
                                  className={styles.seatGap}
                                  aria-hidden="true"
                                />
                              );
                            }
                            const booked = cell.status === 'BOOKED';
                            const selected = cell.id === selectedSeatId;
                            return (
                              <button
                                key={cell.id}
                                type="button"
                                disabled={booked}
                                className={`${styles.seatCell} ${
                                  booked
                                    ? styles.seatBooked
                                    : selected
                                      ? styles.seatSelected
                                      : styles.seatAvailable
                                }`}
                                aria-pressed={booked ? undefined : selected}
                                aria-label={seatDescription(cell.row, cell.number, cell.status)}
                                onClick={() => toggleSeat(cell)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className={styles.legend}>
                      <div className={styles.legendItem}>
                        <span
                          className={styles.legendSwatch}
                          style={{ background: '#272335' }}
                          aria-hidden="true"
                        />
                        <span className={styles.legendLabel}>Available</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span
                          className={styles.legendSwatch}
                          style={{ background: '#00daf3', boxShadow: '0 0 8px #00daf3' }}
                          aria-hidden="true"
                        />
                        <span className={styles.legendLabel}>Selected</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span
                          className={styles.legendSwatch}
                          style={{ background: 'rgba(39, 35, 53, 0.3)' }}
                          aria-hidden="true"
                        />
                        <span className={styles.legendLabel}>Reserved</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={styles.summary}>
                <div className={styles.summaryStats}>
                  <div className={styles.summaryBlock}>
                    <p className={styles.summaryLabel}>Seat</p>
                    <p className={styles.summaryValue} aria-live="polite">
                      {summarySeatLabel}
                    </p>
                  </div>
                  <div className={styles.summaryBlock}>
                    <p className={styles.summaryLabel}>Total price</p>
                    <p className={`${styles.summaryValue} ${styles.summaryPrice}`} aria-live="polite">
                      {summaryPrice}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  disabled={!selectedSessionId || !selectedSeatId || checkoutLoading}
                  onClick={handleCheckout}
                >
                  {checkoutLoading ? 'Processing…' : 'Checkout now'}
                </button>
              </div>
              {bannerError === 'Please sign in to complete your booking.' ? (
                <p className={styles.muted}>
                  <Link className={styles.inlineLink} href="/login">
                    Go to sign in
                  </Link>
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>

      <section className={styles.bento} aria-label="Cinema features">
        <h2 className={styles.bentoTitle}>
          Cinema <span className={styles.bentoAccent}>intelligence</span>
        </h2>
        <div className={styles.bentoGrid}>
          <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
            <h3 className={styles.bentoCardTitle}>Dolby Atmos immersion</h3>
            <p className={styles.bentoCardText}>
              Experience sound that moves around you with breathtaking realism. Our Grand Hall features a
              64-speaker array for true spatial audio.
            </p>
          </div>
          <div className={styles.bentoCard}>
            <h3 className={styles.bentoCardTitle}>4K laser projection</h3>
            <p className={styles.bentoCardText}>Crystal clear imagery with infinite contrast ratios.</p>
            <div className={styles.bentoAccentLine} aria-hidden="true" />
          </div>
          <div className={styles.bentoCard}>
            <h3 className={styles.bentoCardTitle}>Concessions</h3>
            <p className={styles.bentoCardText}>
              Order gourmet snacks directly to your seat via our app.
            </p>
            <div className={`${styles.bentoAccentLine} ${styles.bentoAccentLinePrimary}`} aria-hidden="true" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
