/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Supplier_phone_key` ON `Supplier`(`phone`);
