function clean(value: string) {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

export function generateItemCode(
    brandName: string,
    productName: string,
    storage: string | null,
    categoryName: string
) {
    const brand = clean(brandName || 'GEN').slice(0, 3);

    const name = clean(productName || 'ITEM').slice(0, 4);

    const storageCode = clean(storage || '')
        .replace('GB', '')
        .slice(0, 4);

    const isAccessory =
        categoryName.includes('accessory') ||
        categoryName.includes('accessories') ||
        categoryName.includes('parts');

    const prefix = isAccessory ? 'ACC' : 'PH';

    const unique = Date.now().toString().slice(-6);

    return `${prefix}-${brand}-${name}-${storageCode || 'GEN'}-${unique}`;
}