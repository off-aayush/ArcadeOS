/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `food_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `stations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "food_items_name_key" ON "food_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stations_name_key" ON "stations"("name");
