-- CreateTable
CREATE TABLE "tracking_locations" (
    "id" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracy" DECIMAL(10,2),
    "speed" DECIMAL(10,2),
    "heading" DECIMAL(6,2),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracking_locations_tripId_idx" ON "tracking_locations"("tripId");

-- CreateIndex
CREATE INDEX "tracking_locations_vehicleId_idx" ON "tracking_locations"("vehicleId");

-- CreateIndex
CREATE INDEX "tracking_locations_timestamp_idx" ON "tracking_locations"("timestamp");

-- AddForeignKey
ALTER TABLE "tracking_locations" ADD CONSTRAINT "tracking_locations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "vehicle_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_locations" ADD CONSTRAINT "tracking_locations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_locations" ADD CONSTRAINT "tracking_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
