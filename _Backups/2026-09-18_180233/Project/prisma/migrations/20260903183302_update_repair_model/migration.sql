/*
  Warnings:

  - Added the required column `updatedAt` to the `Repair` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `repair` DROP FOREIGN KEY `Repair_productId_fkey`;

-- DropIndex
DROP INDEX `Repair_productId_fkey` ON `repair`;

-- AlterTable
ALTER TABLE `repair` ADD COLUMN `advancePayment` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `condition` VARCHAR(191) NULL,
    ADD COLUMN `device` VARCHAR(191) NULL,
    ADD COLUMN `expectedCompletionDate` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `productId` INTEGER NULL,
    MODIFY `problem` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Repair` ADD CONSTRAINT `Repair_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
