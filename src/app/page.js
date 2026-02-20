"use client";

import { useState } from "react";
import {
  TrainTile,
  TrainTileCont,
  PlayerHandContext,
} from "./Components/TrainTile";
import { City } from "./Components/City";
import TicketCard from "./Components/TicketCard";
import { TrainCards } from "./Components/Cards";

const CITIES = [
  {
    name: "Regent's Park",
    number: 5,
    x: 230,
    y: 50,
    labelPosition: "top-left",
  },
  {
    name: "Baker Street",
    number: 5,
    x: 50,
    y: 170,
    labelPosition: "top-right",
  },
  { name: "Hyde Park", number: 5, x: 78, y: 527, labelPosition: "bottom" },
  {
    name: "Buckingham Palace",
    number: 2,
    x: 203,
    y: 570,
    labelPosition: "bottom",
  },
  { name: "King's Cross", number: 5, x: 527, y: 47, labelPosition: "top" },
  {
    name: "British Museum",
    number: 1,
    x: 450,
    y: 200,
    labelPosition: "bottom-left",
  },
  {
    name: "Piccadilly Circus",
    number: 2,
    x: 326,
    y: 410,
    labelPosition: "left",
  },
  { name: "Big Ben", number: 2, x: 413, y: 590, labelPosition: "bottom" },
  {
    name: "Elephant & Castle",
    number: 3,
    x: 780,
    y: 630,
    labelPosition: "bottom",
  },
  {
    name: "Trafalgar Square",
    number: 2,
    x: 400,
    y: 470,
    labelPosition: "top-right",
  },
  { name: "Waterloo", number: 3, x: 605, y: 515, labelPosition: "right" },
  {
    name: "Globe Theatre",
    number: 3,
    x: 805,
    y: 445,
    labelPosition: "top-right",
  },
  { name: "St Paul's", number: 4, x: 805, y: 326, labelPosition: "top-right" },
  {
    name: "The Charterhouse",
    number: 4,
    x: 840,
    y: 155,
    labelPosition: "left",
  },
  { name: "Brick Lane", number: 4, x: 1130, y: 155, labelPosition: "top" },
  {
    name: "Tower of London",
    number: 4,
    x: 1130,
    y: 440,
    labelPosition: "top-left",
  },
  {
    name: "Covent Garden",
    number: 1,
    x: 500,
    y: 367,
    labelPosition: "bottom-right",
  },
];

export { CITIES };

const TICKETS = [
  { cityA: "British Museum", cityB: "Piccadilly Circus", points: 2 },
  { cityA: "Baker Street", cityB: "Trafalgar Square", points: 5 },
  { cityA: "Buckingham Palace", cityB: "Brick Lane", points: 9 },
  { cityA: "Hyde Park", cityB: "Covent Garden", points: 3 },
  { cityA: "Globe Theatre", cityB: "Brick Lane", points: 4 },
  { cityA: "Regent's Park", cityB: "Elephant & Castle", points: 9 },
  { cityA: "King's Cross", cityB: "Buckingham Palace", points: 6 },
  { cityA: "Baker Street", cityB: "Tower of London", points: 11 },
  { cityA: "Trafalgar Square", cityB: "St Paul's", points: 4 },
  { cityA: "King's Cross", cityB: "Tower of London", points: 7 },
  { cityA: "Buckingham Palace", cityB: "Elephant & Castle", points: 5 },
  { cityA: "Covent Garden", cityB: "Tower of London", points: 6 },
  { cityA: "Trafalgar Square", cityB: "Globe Theatre", points: 4 },
  { cityA: "British Museum", cityB: "Waterloo", points: 4 },
  { cityA: "Piccadilly Circus", cityB: "Waterloo", points: 3 },
  { cityA: "Hyde Park", cityB: "St Paul's", points: 6 },
  { cityA: "Regent's Park", cityB: "Piccadilly Circus", points: 5 },
  { cityA: "Big Ben", cityB: "The Charterhouse", points: 5 },
  { cityA: "Big Ben", cityB: "Tower of London", points: 6 },
  { cityA: "British Museum", cityB: "St Paul's", points: 4 },
].sort(() => Math.random() - 0.5);
export { TICKETS };

export const TICKETS_PLAYER_EXAMPLE = TICKETS.slice(0, 4);

// Train cards deck: 8 rainbow + 6 of each color (orange, yellow, blue, green, black, red) = 44 total
const ALL_TRAIN_CARDS = [
  ...Array.from({ length: 8 }, () => ({ rainbow: true })),
  ...["orange", "yellow", "blue", "green", "black", "red"].flatMap((c) =>
    Array.from({ length: 6 }, () => ({ color: c })),
  ),
].sort(() => Math.random() - 0.5);

const TRAIN_CARDS_ON_DISPLAY = ALL_TRAIN_CARDS.slice(0, 5);
const TRAIN_CARDS = ALL_TRAIN_CARDS.slice(5);

export { TRAIN_CARDS, TRAIN_CARDS_ON_DISPLAY };

export default function Home() {
  const [playerHand] = useState({
    orange: 2,
    blue: 1,
    black: 3,
    red: 0,
    yellow: 0,
    green: 0,
    rainbow: 0,
  });

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-100 font-sans dark:bg-zinc-900 p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
          Ticket to Ride London
        </h1>
      </header>

      <main className="w-full flex justify-center gap-8 p-4">
        <div className="flex flex-col items-center">
          <div className="relative w-[800px] h-[600px] overflow-auto shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-800">
            <div className="relative min-w-[1200px] aspect-[18/10] bg-white dark:bg-black overflow-hidden">
              <PlayerHandContext.Provider value={playerHand}>
                <div
                  className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(#000 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                ></div>

                {/* Train Connections */}
                <TrainTileCont trainCount={2} x={80} y={150}>
                  <TrainTile color="blue" trainColor="yellow" angle={330} />
                  <TrainTile color="blue" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={4} x={114} y={170}>
                  <TrainTile color="orange" trainColor="yellow" angle={5} />
                  <TrainTile color="orange" trainColor="yellow" angle={0} />
                  <TrainTile color="orange" trainColor="yellow" angle={0} />
                  <TrainTile color="orange" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={280} y={50}>
                  <TrainTile color="green" trainColor="yellow" angle={0} />
                  <TrainTile color="green" trainColor="yellow" angle={0} />
                  <TrainTile color="green" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={580} y={50}>
                  <TrainTile color="red" trainColor="yellow" angle={0} />
                  <TrainTile color="red" trainColor="yellow" angle={12} />
                  <TrainTile color="red" trainColor="yellow" angle={12} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={880} y={155}>
                  <TrainTile color="green" trainColor="yellow" angle={355} />
                  <TrainTile color="green" trainColor="yellow" angle={5} />
                  <TrainTile color="green" trainColor="yellow" angle={5} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={880} y={300}>
                  <TrainTile color="orange" trainColor="yellow" angle={334} />
                  <TrainTile color="orange" trainColor="yellow" angle={0} />
                  <TrainTile color="orange" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={860} y={445}>
                  <TrainTile color="gray" trainColor="yellow" angle={30} />
                  <TrainTile color="gray" trainColor="yellow" angle={-30} />
                  <TrainTile color="gray" trainColor="yellow" angle={-18} />
                </TrainTileCont>
                <TrainTileCont trainCount={4} x={840} y={625}>
                  <TrainTile color="black" trainColor="yellow" angle={-8} />
                  <TrainTile color="black" trainColor="yellow" angle={-13} />
                  <TrainTile color="black" trainColor="yellow" angle={-13} />
                  <TrainTile color="black" trainColor="yellow" angle={-13} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={880} y={320} isDouble={true}>
                  <TrainTile color="yellow" trainColor="blue" angle={20} />
                  <TrainTile color="red" trainColor="blue" angle={0} />
                  <TrainTile color="yellow" trainColor="blue" angle={0} />
                  <TrainTile color="red" trainColor="blue" angle={0} />
                  <TrainTile color="yellow" trainColor="blue" angle={0} />
                  <TrainTile color="red" trainColor="blue" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={1145} y={180}>
                  <TrainTile color="blue" trainColor="yellow" angle={90} />
                  <TrainTile color="blue" trainColor="yellow" angle={0} />
                  <TrainTile color="blue" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={260} y={70}>
                  <TrainTile color="yellow" trainColor="red" angle={14} />
                  <TrainTile color="yellow" trainColor="red" angle={10} />
                  <TrainTile color="yellow" trainColor="red" angle={10} />
                </TrainTileCont>
                <TrainTileCont trainCount={4} x={65} y={190}>
                  <TrainTile color="black" trainColor="yellow" angle={90} />
                  <TrainTile color="black" trainColor="yellow" angle={0} />
                  <TrainTile color="black" trainColor="yellow" angle={355} />
                  <TrainTile color="black" trainColor="yellow" angle={355} />
                </TrainTileCont>
                <TrainTileCont trainCount={4} x={90} y={190}>
                  <TrainTile color="gray" trainColor="yellow" angle={50} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                  <TrainTile color="gray" trainColor="yellow" angle={355} />
                  <TrainTile color="gray" trainColor="yellow" angle={355} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={120} y={470} isDouble={true}>
                  <TrainTile color="gray" trainColor="yellow" angle={345} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={120} y={527} isDouble={true}>
                  <TrainTile color="yellow" trainColor="red" angle={15} />
                  <TrainTile color="orange" trainColor="red" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={345} y={390}>
                  <TrainTile color="gray" trainColor="red" angle={290} />
                  <TrainTile color="gray" trainColor="red" angle={20} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={390} y={360} isDouble={true}>
                  <TrainTile color="green" trainColor="red" angle={355} />
                  <TrainTile color="yellow" trainColor="red" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={240} y={560}>
                  <TrainTile color="red" trainColor="yellow" angle={310} />
                  <TrainTile color="red" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={250} y={580}>
                  <TrainTile color="green" trainColor="yellow" angle={7} />
                  <TrainTile color="green" trainColor="yellow" angle={355} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={260} y={570}>
                  <TrainTile color="gray" trainColor="yellow" angle={325} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={500} y={320} isDouble={true}>
                  <TrainTile color="gray" trainColor="yellow" angle={245} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={440} y={500}>
                  <TrainTile color="gray" trainColor="yellow" angle={5} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={640} y={525}>
                  <TrainTile color="orange" trainColor="yellow" angle={40} />
                  <TrainTile color="orange" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={800} y={620}>
                  <TrainTile color="green" trainColor="yellow" angle={278} />
                  <TrainTile color="green" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={455} y={610}>
                  <TrainTile color="yellow" trainColor="red" angle={5} />
                  <TrainTile color="yellow" trainColor="red" angle={0} />
                  <TrainTile color="yellow" trainColor="red" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={2} x={465} y={580}>
                  <TrainTile color="blue" trainColor="yellow" angle={345} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={415} y={490}>
                  <TrainTile color="gray" trainColor="yellow" angle={80} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={360} y={400} isDouble={true}>
                  <TrainTile color="blue" trainColor="yellow" angle={40} />
                  <TrainTile color="orange" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={420} y={450} isDouble={true}>
                  <TrainTile color="black" trainColor="yellow" angle={320} />
                  <TrainTile color="red" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={4} x={490} y={200}>
                  <TrainTile color="black" trainColor="yellow" angle={290} />
                  <TrainTile color="black" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={4} x={650} y={500}>
                  <TrainTile color="red" trainColor="yellow" angle={330} />
                  <TrainTile color="red" trainColor="yellow" angle={30} />
                </TrainTileCont>
                <TrainTileCont trainCount={3} x={550} y={350} isDouble={true}>
                  <TrainTile color="gray" trainColor="yellow" angle={353} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={4} x={520} y={200}>
                  <TrainTile color="blue" trainColor="yellow" angle={0} />
                  <TrainTile color="blue" trainColor="yellow" angle={357} />
                  <TrainTile color="blue" trainColor="yellow" angle={354} />
                  <TrainTile color="blue" trainColor="yellow" angle={351} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={810} y={430} isDouble={true}>
                  <TrainTile color="gray" trainColor="yellow" angle={270} />
                  <TrainTile color="gray" trainColor="yellow" angle={0} />
                </TrainTileCont>
                <TrainTileCont trainCount={1} x={830} y={275}>
                  <TrainTile color="black" trainColor="yellow" angle={285} />
                </TrainTileCont>

                {/* Cities */}
                {CITIES.map((city) => (
                  <City key={city.name} {...city} />
                ))}
              </PlayerHandContext.Provider>
            </div>
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 italic">
            Scroll to explore the map
          </p>
          <p className="mt-10 text-lg text-zinc-500 dark:text-zinc-400">
            Player board
          </p>
          <div className="flex flex-row mt-10" style={{ gap: "2.5rem" }}>
            <div className="gap-2 flex flex-col justify-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Train Cards
              </p>
              <div className="flex flex-row justify-center border-2 border-dashed">
                <div className="flex flex-col">
                  <TrainCards color="orange" />
                  <TrainCards color="orange" />
                </div>
                <div className="flex flex-col">
                  <TrainCards color="blue" />
                </div>
                <div className="flex flex-col">
                  <TrainCards color="black" />
                  <TrainCards color="black" />
                  <TrainCards color="black" />
                </div>
              </div>
            </div>

            <div className="gap-2 flex flex-col justify-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Ticket Cards
              </p>
              <div className="flex flex-col justify-center border-2 border-dashed">
                {TICKETS_PLAYER_EXAMPLE.map((c, i) => (
                  <div
                    key={i}
                    className="transition-transform hover:-translate-y-1"
                  >
                    <TicketCard
                      cityA={c.cityA}
                      cityB={c.cityB}
                      points={c.points}
                      opposite={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-12">
          {/* Ticket Stack */}
          <div className="relative w-[210px] h-[120px] mt-10">
            {TICKETS.map((t, i) => (
              <div
                key={i}
                className="absolute transition-transform hover:-translate-y-1"
                style={{
                  top: -i * 2,
                  left: i * 0.5,
                  zIndex: i,
                }}
              >
                <TicketCard
                  cityA={t.cityA}
                  cityB={t.cityB}
                  points={t.points}
                  opposite={false}
                />
              </div>
            ))}
            <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Ticket Deck ({TICKETS.length})
            </div>
          </div>

          {/* Train Card Stack */}
          <div className="relative w-[176px] h-[120px] mt-16">
            {TRAIN_CARDS.map((c, i) => (
              <div
                key={i}
                className="absolute transition-transform hover:-translate-y-1"
                style={{
                  top: -i * 1.2,
                  left: i * 0.5,
                  zIndex: i,
                }}
              >
                <TrainCards
                  color={c.color}
                  rainbow={!!c.rainbow}
                  opposite={true}
                />
              </div>
            ))}
            <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Train Deck ({TRAIN_CARDS.length})
            </div>
          </div>

          {/* Cards on Display */}
          <div className="relative w-[176px] mt-20">
            <div className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Cards on Display
            </div>
            <div className="flex flex-col gap-4">
              {TRAIN_CARDS_ON_DISPLAY.map((c, i) => (
                <div
                  key={i}
                  className="transition-transform hover:-translate-y-1"
                >
                  <TrainCards
                    color={c.color}
                    rainbow={!!c.rainbow}
                    opposite={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
