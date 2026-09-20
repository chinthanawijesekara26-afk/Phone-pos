/*
  Warnings:

  - A unique constraint covering the columns `[productCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `product` ADD COLUMN `model` VARCHAR(191) NULL,
    ADD COLUMN `productCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Product_productCode_key` ON `Product`(`productCode`);
