import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const formatMoney = (cents: number) => (cents / 100).toFixed(2);
const toCents = (price: { toNumber: () => number }) =>
  Math.round(price.toNumber() * 100);

const loadCart = async (userId:number) =>{
    const cart = await prisma.cart.upsert({
        where:{userId},
        update:{},
        create:{userId},
        include:{
            items:{
                orderBy:{id:"asc"},
                include:{
                    product:{
                        select:{id: true, name: true, price: true, stock: true, imageUrl: true}
                    }
                }
            }
        }
    })
    let subtotalCents = 0;
    let totalItems = 0;
    const items = cart.items.map((item) =>{
        const unitCents =toCents(item.product.price);
        const lineCents = unitCents * item.quantity;

        subtotalCents += lineCents;
        totalItems += item.quantity;

        return {
      productId: item.productId,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      price: formatMoney(unitCents),
      quantity: item.quantity,
      lineTotal: formatMoney(lineCents),
      stock: item.product.stock,
      available: item.quantity <= item.product.stock,
        }
    })
    return{
    id: cart.id,
    items,
    totalItems,
    subtotal: formatMoney(subtotalCents), 
    }
}

const getCartId = async(userId:number)=>{
    const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return cart.id;
}

export const getCart = (userId: number) => loadCart(userId);

export const addItem = async(userId:number,productId:number,quantity:number) =>{
    const product= await prisma.product.findUnique({
        where:{id:productId},
        select:{id:true,stock:true}
    })
    if (!product) {
        throw new AppError(404, "mehsul tapilmadi")
    }
    if(product.stock === 0){
        throw new AppError(409,"hazirda stokda yoxdur")
    }
    const cartId = await getCartId(userId)
     
    const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
    select: { quantity: true },
  });

  const newQuantity = (existing?.quantity ?? 0) + quantity;
  if (newQuantity > product.stock) {
    throw new AppError(
      409,
      `Stokda yalnız ${product.stock} ədəd var (səbətinizdə ${existing?.quantity ?? 0} ədəd)`
    );
  }
   await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: newQuantity },
    create: { cartId, productId, quantity: newQuantity },
  });
  return loadCart(userId);
}

export const updateItem = async(userId:number, productId:number, quantity:number) =>{
const cartId = await getCartId(userId)

const item = await prisma.cartItem.findUnique({
   where: { cartId_productId: { cartId, productId } },
    include: { product: { select: { stock: true } } }, 
})
 if (!item) {
    throw new AppError(404, "Bu məhsul səbətinizdə yoxdur");
  }

  if (quantity > item.product.stock) {
    throw new AppError(409, `Stokda yalnız ${item.product.stock} ədəd var`);
  }
  await prisma.cartItem.update({
    where:{cartId_productId:{cartId, productId}},
    data:{quantity}
  })

  return loadCart(userId)
}

export const removeItem = async(userId: number, productId: number) =>{
    const cartId = await getCartId(userId)

    const {count} = await prisma.cartItem.deleteMany({
        where:{cartId, productId}
    })
    if (count === 0) {
        throw new AppError(404, "bu mehsul sebetinizde yoxdur")
    }
    return loadCart(userId)
}

export const clearCart = async(userId:number)=>{
    const cartId = await getCartId(userId)
    await prisma.cartItem.deleteMany({where:{cartId}})
    return loadCart(userId)
}