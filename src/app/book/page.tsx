"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, CreditCard, Lock, CheckCircle, ChevronLeft } from "lucide-react";
import { useBookings } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const ALL_SLOTS = [
  "7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM",
  "1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM",
  "7:00 PM","7:30 PM","8:00 PM","8:30 PM","9:00 PM",
];

const cageOptions = [
  { id: "cage1", label: "Cage #1 – 30 min", price: 30, memberPrice: 25, type: "individual" },
  { id: "cage2", label: "Cage #2 – 30 min", price: 30, memberPrice: 25, type: "individual" },
  { id: "cage1-60", label: "Cage #1 – 60 min", price: 50, memberPrice: 45, type: "individual" },
  { id: "hittrax", label: "HitTrax Cage – 60 min", price: 70, memberPrice: 60, type: "individual" },
  { id: "team-1cage", label: "Team – 60 min (1 cage)", price: 55, memberPrice: null, type: "team" },
  { id: "team-2cage", label: "Team – 60 min (2 cages)", price: 95, memberPrice: null, type: "team" },
  { id: "team-pkg", label: "Team Package (Turf + 2 cages)", price: 130, memberPrice: 115, type: "team" },
];

const steps = ["Select Cage", "Choose Time", "Confirm & Pay"];

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function EasterEggModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full rounded-2xl shadow-2xl" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function BookPage() {
  const [step, setStep] = useState(0);
  const [selectedCage, setSelectedCage] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [useCredit, setUseCredit] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [easterEgg, setEasterEgg] = useState<"judges" | "oleg" | "alexey" | null>(null);
  const [pin] = useState(generatePin());
  const now = new Date();
  const todayRaw = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDateRaw, setSelectedDateRaw] = useState(todayRaw);
  const selectedDate = new Date(selectedDateRaw + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const { addBooking, bookings } = useBookings();
  const { member, refreshMember } = useAuth();

  const isMember = !!member;
  const creditsLeft = Math.max(0, (member?.credits_total ?? 0) - (member?.credits_used ?? 0));
  const atCap = bookings.length >= 3;

  const cage = cageOptions.find((c) => c.id === selectedCage);

  // Next 14 days as selectable date buttons
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const raw = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { raw, weekday: d.toLocaleDateString("en-US", { weekday: "short" }), day: d.getDate(), month: d.toLocaleDateString("en-US", { month: "short" }) };
  });

  // Fetch already-booked times for the selected date + cage from DB
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!cage || !selectedDate) return;
    supabase
      .from("bookings")
      .select("time")
      .eq("date", selectedDate)
      .eq("cage_type", cage.label)
      .eq("status", "confirmed")
      .then(({ data }) => {
        setBookedTimes(new Set(data?.map((b: { time: string }) => b.time) ?? []));
      });
  }, [selectedDate, cage?.label]);
  const price = cage ? (isMember && cage.memberPrice ? cage.memberPrice : cage.price) : 0;

  const easterEggSrc = easterEgg === "judges" ? "/Judges.png" : easterEgg === "oleg" ? "/Oleg and alex.png" : easterEgg === "alexey" ? "/Alexey.png" : null;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        {easterEggSrc && <EasterEggModal src={easterEggSrc} alt="easter egg" onClose={() => setEasterEgg(null)} />}
      <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-10 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-gray-400 mb-8">Your cage is reserved. Your access PIN has been sent to your email and phone.</p>
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <p className="text-gray-400 text-sm mb-1">Access PIN</p>
            <p className="text-5xl font-black text-blue-400 tracking-widest">{pin}</p>
            <p className="text-gray-500 text-xs mt-2">Active 15 min before — expires at session end</p>
          </div>
          <div className="text-left space-y-2 mb-8 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Date</span><span className="text-white font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Time</span><span className="text-white font-medium">{selectedSlot}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Cage</span><span className="text-white font-medium">{cage?.label}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Payment</span><span className="text-white font-medium">{useCredit ? "Membership Credit" : `$${price} charged`}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors text-center">
              View My Dashboard
            </Link>
            <button
              onClick={() => { setConfirmed(false); setStep(0); setSelectedCage(null); setSelectedSlot(null); }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Book Another Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      {easterEggSrc && <EasterEggModal src={easterEggSrc} alt="easter egg" onClose={() => setEasterEgg(null)} />}
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Book a Cage</h1>
        <p className="text-gray-400 mb-8">Reserve your spot at DiamondBase.</p>

        {atCap && (
          <div className="mb-6 bg-yellow-950/30 border border-yellow-500/30 rounded-xl p-4 text-yellow-300 text-sm">
            You have 3 active bookings (the maximum). Cancel one from your dashboard before booking again.
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === step ? "text-white" : "text-gray-500"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-green-500" : "bg-gray-800"}`}></div>}
            </div>
          ))}
        </div>

        {/* Step 0: Select Cage */}
        {step === 0 && (
          <div className="space-y-4">
            {isMember && (
              <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-3 mb-2 text-sm text-blue-300">
                Member pricing applied · <span className="font-semibold">{creditsLeft} credit{creditsLeft !== 1 ? "s" : ""} remaining</span>
              </div>
            )}
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-3">Individual</p>
            {cageOptions.filter(c => c.type === "individual").map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCage(c.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedCage === c.id ? "border-blue-500 bg-blue-950/30" : "border-gray-800 bg-gray-900 hover:border-gray-600"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{c.label}</span>
                  <div className="text-right">
                    {isMember && c.memberPrice ? (
                      <div>
                        <span className="text-blue-400 font-bold">${c.memberPrice}</span>
                        <span className="text-gray-500 text-xs line-through ml-2">${c.price}</span>
                      </div>
                    ) : (
                      <span className="text-white font-bold">${c.price}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mt-6 mb-3">Team</p>
            {cageOptions.filter(c => c.type === "team").map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCage(c.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedCage === c.id ? "border-blue-500 bg-blue-950/30" : "border-gray-800 bg-gray-900 hover:border-gray-600"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{c.label}</span>
                  <div className="text-right">
                    {isMember && c.memberPrice ? (
                      <div>
                        <span className="text-blue-400 font-bold">${c.memberPrice}</span>
                        <span className="text-gray-500 text-xs line-through ml-2">${c.price}</span>
                      </div>
                    ) : (
                      <span className="text-white font-bold">${c.price}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            <button
              disabled={!selectedCage || atCap}
              onClick={() => setStep(1)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Next: Choose Time
            </button>
          </div>
        )}

        {/* Step 1: Choose Time */}
        {step === 1 && (
          <div>
            <button onClick={() => setStep(0)} className="flex items-center gap-1 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="mb-6">
              <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">Select Date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map((d) => (
                  <button
                    key={d.raw}
                    onClick={() => { setSelectedDateRaw(d.raw); setSelectedSlot(null); }}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border transition-colors min-w-[56px] ${
                      selectedDateRaw === d.raw
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <span className="text-xs opacity-70">{d.weekday}</span>
                    <span className="text-lg font-bold leading-tight">{d.day}</span>
                    <span className="text-xs opacity-70">{d.month}</span>
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2">{selectedDate}</p>
            </div>

            <p className="text-gray-400 text-sm mb-4">Available time slots for <span className="text-white font-medium">{cage?.label}</span>:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
              {ALL_SLOTS.map((time) => {
                const taken = bookedTimes.has(time);
                return (
                  <button
                    key={time}
                    disabled={taken}
                    onClick={() => {
                      setSelectedSlot(time);
                      if (
                        (selectedCage === "cage1" || selectedCage === "cage1-60") &&
                        selectedDate === "Mar 6, 2026" &&
                        time === "8:00 PM"
                      ) {
                        setEasterEgg("oleg");
                      }
                      if (
                        (selectedCage === "cage1" || selectedCage === "cage1-60") &&
                        selectedDate === "Mar 7, 2026" &&
                        time === "8:00 PM"
                      ) {
                        setEasterEgg("alexey");
                      }
                    }}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                      taken
                        ? "bg-gray-800 text-gray-600 cursor-not-allowed line-through"
                        : selectedSlot === time
                        ? "bg-blue-600 text-white"
                        : "bg-gray-900 border border-gray-700 text-gray-300 hover:border-blue-500 hover:text-white"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 text-xs text-gray-500 mb-6">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block"></span> Selected</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-900 border border-gray-700 inline-block"></span> Available</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-800 inline-block"></span> Booked</span>
            </div>
            <button
              disabled={!selectedSlot}
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Next: Confirm & Pay
            </button>
          </div>
        )}

        {/* Step 2: Confirm & Pay */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-300"><span className="flex items-center gap-2"><Calendar className="h-4 w-4" />Date</span><span className="text-white">{selectedDate}</span></div>
                <div className="flex justify-between text-gray-300"><span className="flex items-center gap-2"><Clock className="h-4 w-4" />Time</span><span className="text-white">{selectedSlot}</span></div>
                <div className="flex justify-between text-gray-300"><span>Session</span><span className="text-white">{cage?.label}</span></div>
                <div className="border-t border-gray-800 pt-3 flex justify-between font-semibold"><span className="text-gray-300">Total</span><span className="text-white text-lg">{useCredit ? "1 Credit" : `$${price}`}</span></div>
              </div>
            </div>

            {isMember && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 ${creditsLeft > 0 ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}>
                    <input type="radio" checked={useCredit} onChange={() => creditsLeft > 0 && setUseCredit(true)} disabled={creditsLeft === 0} className="accent-blue-500" />
                    <div>
                      <p className="text-white text-sm font-medium">Use Membership Credit</p>
                      <p className="text-gray-500 text-xs">{creditsLeft} credit{creditsLeft !== 1 ? "s" : ""} remaining this month</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={!useCredit} onChange={() => setUseCredit(false)} className="accent-blue-500" />
                    <div>
                      <p className="text-white text-sm font-medium">Pay with Card — ${price}</p>
                      <p className="text-gray-500 text-xs">Member rate applied</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 font-medium text-sm">Access PIN will be auto-generated</p>
                <p className="text-gray-400 text-xs mt-0.5">A 4-digit PIN will be emailed and texted to you. It activates 15 minutes before your session and expires at the end.</p>
              </div>
            </div>

            <div className="bg-yellow-950/30 border border-yellow-500/20 rounded-xl p-4 mb-6 text-xs text-yellow-300">
              <strong>Cancellation policy:</strong> Cancel 48+ hrs before for a full refund. Under 48 hrs = 50% refund (card) or credit forfeited. No-shows are charged a $15 fee.
            </div>

            {bookingError && (
              <div className="mb-4 bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                {bookingError}
              </div>
            )}

            <button
              onClick={async () => {
                setBookingError(null);
                const result = await addBooking({
                  date: selectedDate,
                  time: selectedSlot!,
                  cage_type: cage!.label,
                  pin,
                  status: "confirmed",
                  payment_method: useCredit ? "Membership Credit" : `$${price} card charge`,
                });
                if (result.error) {
                  setBookingError(result.error);
                } else {
                  await refreshMember();
                  setConfirmed(true);
                  if (
                    (selectedCage === "cage1" || selectedCage === "cage1-60") &&
                    selectedDate === "Mar 5, 2026" &&
                    selectedSlot === "8:00 PM"
                  ) {
                    setEasterEgg("judges");
                  }
                }
              }}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" /> Confirm Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
