-- AlterTable
ALTER TABLE `sale` ADD COLUMN `cardReceived` DOUBLE NULL,
    MODIFY `paymentMethod` ENUM('CASH', 'CARD', 'QR', 'BANK', 'INSTALLMENT', 'SPLIT') NOT NULL;
