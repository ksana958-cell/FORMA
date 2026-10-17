/* FORMA 2.0: примерное меню, собственный каталог ингредиентов.
   Значения на 100 г округлены. Проверяй упаковку и способ приготовления. */
(() => {
'use strict';
const F={
 oats:['Овсяные хлопья, сухие',370,13,7,60],milk:['Молоко 2,5%',52,3,2.5,5],eggs:['Яйца (съедобная часть)',143,13,10,1],banana:['Банан',89,1.1,.3,23],pb:['Арахисовая паста',590,25,50,20],cottage:['Творог 5%',121,17,5,3],berries:['Ягоды',45,1,.5,10],yogurt:['Греческий йогурт 2%',73,9,2,4],granola:['Мюсли/гранола',450,10,15,65],bread:['Цельнозерновой хлеб',245,9,3,45],cheese:['Твёрдый сыр',345,24,26,1],turkeySlice:['Ветчина из индейки',110,21,2,1],chicken:['Куриная грудка, готовая',165,31,3.6,0],turkey:['Филе индейки, готовое',150,29,2,0],rice:['Рис, варёный',130,2.7,.3,28],buckwheat:['Гречка, варёная',110,3.6,1.1,21],pasta:['Макароны, варёные',158,5.8,1,31],potato:['Картофель печёный',93,2.5,.2,21],salmon:['Лосось, готовый',206,22,12,0],cod:['Белая рыба, готовая',104,23,1,0],beef:['Нежирная говядина, готовая',200,28,10,0],veg:['Овощи, смесь',35,2,.3,6],oil:['Оливковое масло',884,0,100,0],apple:['Яблоко',52,.3,.2,14],nuts:['Орехи, смесь',610,18,54,18],kefir:['Кефир 2,5%',51,3,2.5,4],tortilla:['Лаваш/тортилья',310,8,8,50],beans:['Фасоль, варёная',120,8,.5,21],hummus:['Хумус',220,7,14,16],avocado:['Авокадо',160,2,15,9],tuna:['Тунец в собственном соку',116,26,1,0],dates:['Финики',275,2,0,75],chocolate:['Тёмный шоколад',560,8,40,46]
};
// Состав: [ключ продукта, граммы]. Для всех круп используется масса готового продукта,
// кроме овсянки — сухой. Масса яиц относится к съедобной части.
const R={
 oatsPower:['Овсянка с бананом и яйцами','breakfast',[['oats',80],['milk',250],['banana',130],['eggs',110],['pb',15]]],
 curdBowl:['Творог, хлеб и фрукты','breakfast',[['cottage',220],['bread',105],['banana',120],['berries',100]]],
 eggsToast:['Омлет, тосты и фрукты','breakfast',[['eggs',165],['bread',135],['cheese',25],['veg',150],['apple',170]]],
 yogurtBowl:['Йогурт с мюсли, ягодами и орехами','breakfast',[['yogurt',300],['granola',90],['berries',160],['nuts',20]]],
 oatsCurd:['Овсянка с творогом','breakfast',[['oats',90],['milk',200],['cottage',170],['berries',120],['banana',100]]],
 toastTurkey:['Тосты с индейкой и авокадо','breakfast',[['bread',145],['turkeySlice',125],['avocado',90],['eggs',55],['veg',100]]],
 omeletPorridge:['Омлет и овсянка с бананом','breakfast',[['eggs',130],['oats',65],['milk',240],['banana',120],['cheese',20]]],
 riceChicken:['Курица с рисом и овощами','lunch',[['chicken',200],['rice',280],['veg',250],['oil',12]]],
 buckBeef:['Гречка с говядиной и овощами','lunch',[['beef',175],['buckwheat',320],['veg',220],['oil',10]]],
 pastaTurkey:['Паста с индейкой и овощами','lunch',[['turkey',200],['pasta',290],['veg',240],['oil',10]]],
 salmonPotato:['Лосось с картофелем и салатом','lunch',[['salmon',185],['potato',360],['veg',220],['oil',8]]],
 riceTuna:['Рис с тунцом и овощами','lunch',[['tuna',180],['rice',330],['veg',230],['oil',12],['beans',90]]],
 chickenWrap:['Лаваш с курицей и хумусом','lunch',[['tortilla',120],['chicken',175],['hummus',65],['veg',240]]],
 beefPotato:['Говядина с печёным картофелем','lunch',[['beef',175],['potato',380],['veg',200],['oil',10]]],
 fishPasta:['Белая рыба с пастой','dinner',[['cod',220],['pasta',290],['veg',250],['oil',12]]],
 turkeyBuck:['Индейка с гречкой','dinner',[['turkey',220],['buckwheat',340],['veg',230],['oil',12]]],
 chickenPotato:['Курица с картофелем','dinner',[['chicken',200],['potato',340],['veg',250],['oil',12]]],
 tunaPasta:['Паста с тунцом и авокадо','dinner',[['tuna',185],['pasta',280],['avocado',90],['veg',220]]],
 salmonRice:['Лосось и рис с овощами','dinner',[['salmon',180],['rice',270],['veg',250]]],
 beefRice:['Говядина с рисом','dinner',[['beef',170],['rice',290],['veg',260],['oil',8]]],
 beanTurkey:['Фасоль и индейка с овощами','dinner',[['turkey',200],['beans',270],['bread',75],['veg',230],['oil',8]]],
 snackYogurt:['Йогурт, орехи и фрукты','snack',[['yogurt',250],['nuts',30],['apple',200],['chocolate',20]]],
 snackCurd:['Творог с ягодами и хлебом','snack',[['cottage',200],['berries',130],['bread',95],['chocolate',20]]],
 snackKefir:['Кефир, банан и орехи','snack',[['kefir',400],['banana',155],['nuts',35],['dates',40]]],
 snackSandwich:['Сэндвич с индейкой','snack',[['bread',100],['turkeySlice',120],['cheese',25],['veg',120],['apple',160]]],
 snackHummus:['Хумус, хлеб и фрукты','snack',[['hummus',120],['bread',105],['veg',170],['banana',115]]],
 snackCurdNuts:['Творог с бананом и орехами','snack',[['cottage',230],['banana',145],['nuts',25],['chocolate',15]]],
 snackEggs:['Яйца, тост и йогурт','snack',[['eggs',110],['bread',90],['yogurt',200],['berries',130]]]
};
// Корректировка порций: суточный рацион рассчитан примерно на 2700 ккал, а не 3100.
const factor={chicken:.75,turkey:.75,tuna:.75,beef:.75,salmon:.78,cod:.75,eggs:.85,cottage:.78,turkeySlice:.8,yogurt:.85,cheese:.8,nuts:.72,pb:.75,oil:.82,beans:.9};
for(const r of Object.values(R)) r[2]=r[2].map(([k,g])=>[k,Math.round(g*(factor[k]||1)*.94)]);
const week=[
 ['Понедельник','oatsPower','riceChicken','fishPasta','snackYogurt'],
 ['Вторник','curdBowl','buckBeef','turkeyBuck','snackKefir'],
 ['Среда','eggsToast','pastaTurkey','chickenPotato','snackCurd'],
 ['Четверг','yogurtBowl','salmonPotato','tunaPasta','snackSandwich'],
 ['Пятница','oatsCurd','riceTuna','salmonRice','snackCurdNuts'],
 ['Суббота','toastTurkey','chickenWrap','beefRice','snackHummus'],
 ['Воскресенье','omeletPorridge','beefPotato','beanTurkey','snackEggs']
];
function recipe(key){const r=R[key];if(!r)return null;const result={key,title:r[0],meal_type:r[1],items:r[2].map(([id,grams])=>({id,name:F[id][0],grams}))};
 let t={calories:0,protein:0,fat:0,carbs:0};for(const item of result.items){const f=F[item.id];const n=item.grams/100;t.calories+=f[1]*n;t.protein+=f[2]*n;t.fat+=f[3]*n;t.carbs+=f[4]*n;}
 for(const k of Object.keys(t))t[k]=Math.round(t[k]*10)/10;return {...result,...t};}
window.FORMA_MEAL_PLAN={foods:F,recipes:R,week,recipe};
})();
