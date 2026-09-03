/**
 * Catalogue copy for the seed.
 *
 * Names, categories, dress styles and target ratings come from the reference
 * implementation at `shop.co/shop.co/src/store/Constants.js`. Prices are
 * corrected: the reference derived the "original" price as
 * `price + price * discount%`, which overstates the discount. Here `price` is
 * what the customer pays and `compareAt` is the original, so the percentage
 * shown in the UI is derived and can never contradict the two numbers beside it.
 */

export type SeedProduct = {
  slug: string;
  name: string;
  image: string;
  category: string;
  styles: string[];
  colors: string[];
  sizes: string[];
  price: number;
  compareAt?: number;
  isNewArrival?: boolean;
  isTopSelling?: boolean;
  description: string;
  details: string;
  reviews: { author: string; rating: number; body: string; daysAgo: number }[];
};

export const CATEGORIES = [
  { slug: "t-shirts", name: "T-Shirts", position: 0 },
  { slug: "shirts", name: "Shirts", position: 1 },
  { slug: "jeans", name: "Jeans", position: 2 },
  { slug: "shorts", name: "Shorts", position: 3 },
];

export const DRESS_STYLES = [
  { slug: "casual", name: "Casual", position: 0 },
  { slug: "formal", name: "Formal", position: 1 },
  { slug: "party", name: "Party", position: 2 },
  { slug: "gym", name: "Gym", position: 3 },
];

export const COLORS = [
  { slug: "green", name: "Green", hex: "#00C12B", position: 0 },
  { slug: "red", name: "Red", hex: "#F50606", position: 1 },
  { slug: "yellow", name: "Yellow", hex: "#F5DD06", position: 2 },
  { slug: "orange", name: "Orange", hex: "#F57906", position: 3 },
  { slug: "cyan", name: "Cyan", hex: "#06CAF5", position: 4 },
  { slug: "blue", name: "Blue", hex: "#063AF5", position: 5 },
  { slug: "purple", name: "Purple", hex: "#7D06F5", position: 6 },
  { slug: "pink", name: "Pink", hex: "#F506A4", position: 7 },
  { slug: "white", name: "White", hex: "#FFFFFF", position: 8 },
  { slug: "black", name: "Black", hex: "#000000", position: 9 },
];

export const SIZES = [
  { slug: "small", name: "Small", position: 0 },
  { slug: "medium", name: "Medium", position: 1 },
  { slug: "large", name: "Large", position: 2 },
  { slug: "x-large", name: "X-Large", position: 3 },
  { slug: "xx-large", name: "XX-Large", position: 4 },
  { slug: "3x-large", name: "3X-Large", position: 5 },
];

const TEE_SIZES = ["small", "medium", "large", "x-large", "xx-large", "3x-large"];
const STD_SIZES = ["small", "medium", "large", "x-large"];

export const PROMO_CODES = [
  { code: "SHOPCO20", percentOff: 20 },
  { code: "FASHION10", percentOff: 10 },
];

export const TESTIMONIALS = [
  {
    authorName: "Sarah M.",
    body: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.",
  },
  {
    authorName: "Alex K.",
    body: "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions.",
  },
  {
    authorName: "James L.",
    body: "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends.",
  },
  {
    authorName: "Mooen",
    body: "The checkout was painless and the parcel turned up two days early. Sizing matched the guide exactly, which almost never happens when I order online.",
  },
  {
    authorName: "Samantha D.",
    body: "I ordered three tees on a whim and ended up wearing them every week. The fabric has held its shape and colour through a dozen washes.",
  },
];

export const PRODUCTS: SeedProduct[] = [
  {
    slug: "t-shirt-with-tape-details",
    name: "T-shirt with Tape Details",
    image: "t-shirt-with-tape-details.png",
    category: "t-shirts",
    styles: ["casual", "party"],
    colors: ["black", "white", "green"],
    sizes: TEE_SIZES,
    price: 120,
    isNewArrival: true,
    description:
      "A relaxed cotton tee finished with woven tape along the sleeve hems. Cut a little longer in the body so it sits well untucked.",
    details:
      "Crafted from 100% combed cotton jersey at 180 gsm, this t-shirt is pre-shrunk and garment washed for a soft hand feel from the first wear. The ribbed crew neck is taped shoulder to shoulder to hold its shape, and the contrast tape detail runs along both sleeve openings. Machine wash cold, tumble dry low.",
    reviews: [
      { author: "Samantha D.", rating: 5, body: "The fit is spot on and the tape detail looks far more expensive than the price suggests. I bought a second one in white a week later.", daysAgo: 12 },
      { author: "Alex M.", rating: 4, body: "Great weight of cotton — not see-through like most tees at this price. Knocking one star off because the body runs slightly long on me.", daysAgo: 26 },
      { author: "Ethan R.", rating: 5, body: "Washed it eight times now and it has not twisted or faded at all. Exactly what I want from a plain black tee.", daysAgo: 41 },
      { author: "Olivia P.", rating: 4, body: "Comfortable and well made. Would love to see more colours in this cut.", daysAgo: 58 },
    ],
  },
  {
    slug: "skinny-fit-jeans",
    name: "Skinny Fit Jeans",
    image: "skinny-fit-jeans.png",
    category: "jeans",
    styles: ["casual", "formal"],
    colors: ["blue", "black"],
    sizes: STD_SIZES,
    price: 240,
    compareAt: 300,
    isNewArrival: true,
    description:
      "A mid-rise skinny jean in a stretch denim that holds its shape through the day. Lightly whiskered at the front for a lived-in look.",
    details:
      "Woven from 92% cotton, 6% polyester and 2% elastane so there is real give without bagging at the knee. Five-pocket construction, branded shank button and a tapered leg opening of 14 cm. The wash is a mid indigo with subtle hand-sanding at the thigh. Wash inside out with like colours.",
    reviews: [
      { author: "Daniel K.", rating: 4, body: "Proper stretch denim — I can sit through a full workday in these. The indigo bled a little on the first wash but settled after that.", daysAgo: 9 },
      { author: "Priya S.", rating: 3, body: "Nice quality but they run at least one size small. Order up if you are between sizes.", daysAgo: 22 },
      { author: "Marcus T.", rating: 4, body: "Great cut through the leg. The whiskering is subtle enough to wear to the office.", daysAgo: 37 },
      { author: "Jonah W.", rating: 3, body: "Good jeans, though for the price I expected a heavier denim.", daysAgo: 63 },
    ],
  },
  {
    slug: "checkered-shirt",
    name: "Checkered Shirt",
    image: "checkered-shirt.png",
    category: "shirts",
    styles: ["formal", "party"],
    colors: ["red", "blue"],
    sizes: STD_SIZES,
    price: 180,
    isNewArrival: true,
    isTopSelling: true,
    description:
      "A brushed cotton check shirt with a soft collar and a single chest pocket. Warm enough to wear as a light overshirt.",
    details:
      "Yarn-dyed cotton flannel brushed on both faces for softness, with the check pattern matched across the placket and pockets. Curved hem, horn-effect buttons and a two-button adjustable cuff. Cut to a regular fit through the chest with a slight taper at the waist.",
    reviews: [
      { author: "Ryan H.", rating: 5, body: "The pattern is genuinely matched at the seams, which is rare at this price. Feels like a much more expensive shirt.", daysAgo: 6 },
      { author: "Nadia F.", rating: 4, body: "Lovely brushed finish and the colours are richer in person than on screen.", daysAgo: 19 },
      { author: "Tom B.", rating: 5, body: "Wearing it as an overshirt over a tee and it works perfectly. Sleeves are a good length.", daysAgo: 44 },
      { author: "Grace L.", rating: 4, body: "Slightly boxy on me but I sized down and it is now my favourite shirt.", daysAgo: 71 },
    ],
  },
  {
    slug: "sleeve-striped-t-shirt",
    name: "Sleeve Striped T-shirt",
    image: "sleeve-striped-t-shirt.png",
    category: "t-shirts",
    styles: ["casual", "party"],
    colors: ["orange", "black", "white"],
    sizes: TEE_SIZES,
    price: 130,
    compareAt: 185,
    isNewArrival: true,
    description:
      "A raglan-sleeve tee with a vertical stripe body and solid contrast sleeves. A baseball-shirt shape with a modern, boxier cut.",
    details:
      "Single-jersey cotton with a set-in raglan sleeve that gives a cleaner shoulder line than a standard tee. The stripe is woven rather than printed, so it will not crack or peel. Ribbed collar with a herringbone neck tape. Machine wash cold, do not iron the print.",
    reviews: [
      { author: "Chris D.", rating: 5, body: "The raglan cut is really flattering and the stripes are woven in, not printed. No cracking after months of wear.", daysAgo: 4 },
      { author: "Amelia J.", rating: 4, body: "Bright, well made and holds colour. The orange is a touch more red than pictured.", daysAgo: 17 },
      { author: "Ben O.", rating: 5, body: "Bought this on sale and it has become my go-to weekend shirt.", daysAgo: 33 },
      { author: "Farah N.", rating: 4, body: "Boxier than I expected but I have grown to like it that way.", daysAgo: 52 },
    ],
  },
  {
    slug: "vertical-striped-shirt",
    name: "Vertical Striped Shirt",
    image: "vertical-striped-shirt.png",
    category: "shirts",
    styles: ["formal"],
    colors: ["green", "white"],
    sizes: STD_SIZES,
    price: 212,
    compareAt: 265,
    isNewArrival: true,
    isTopSelling: true,
    description:
      "A fine vertical stripe in a lightweight cotton, cut with a grandad collar for an easier, less formal line.",
    details:
      "Woven from long-staple cotton at 120 gsm, this shirt is light enough for warm weather while still holding a press. The grandad collar sits flat without a tie, and the single-button cuff keeps the sleeve clean. Side gussets at the hem reduce strain when worn tucked.",
    reviews: [
      { author: "Louis A.", rating: 5, body: "Beautiful lightweight cotton. Perfect for summer and it looks sharp untucked.", daysAgo: 3 },
      { author: "Hana K.", rating: 5, body: "The grandad collar makes it so much more wearable than a standard formal shirt. I own two.", daysAgo: 15 },
      { author: "Peter V.", rating: 5, body: "Presses beautifully and the stripe is very fine. Genuinely excellent quality.", daysAgo: 30 },
      { author: "Ines M.", rating: 5, body: "Bought for a wedding and got compliments all day.", daysAgo: 49 },
    ],
  },
  {
    slug: "courage-graphic-t-shirt",
    name: "Courage Graphic T-shirt",
    image: "courage-graphic-t-shirt.png",
    category: "t-shirts",
    styles: ["casual", "party"],
    colors: ["orange", "black"],
    sizes: TEE_SIZES,
    price: 145,
    isTopSelling: true,
    description:
      "An oversized tee with a large hand-drawn graphic across the chest. Dropped shoulders and a heavier body for a relaxed drape.",
    details:
      "Heavyweight 220 gsm cotton with a dropped shoulder and a wide body. The artwork is screen printed with a soft-hand water-based ink so it moves with the fabric instead of sitting on top of it. Turn inside out to wash and avoid tumble drying to keep the print sharp.",
    reviews: [
      { author: "Kofi A.", rating: 4, body: "Lovely heavy cotton and the print feels soft rather than plasticky. Very happy.", daysAgo: 8 },
      { author: "Zoe R.", rating: 4, body: "Oversized as promised. Size down if you want a regular fit.", daysAgo: 24 },
      { author: "Marco P.", rating: 4, body: "Print has survived a lot of washes. Colour is still vivid.", daysAgo: 40 },
      { author: "Iris T.", rating: 4, body: "Good quality but the orange is quite loud — worth knowing before you buy.", daysAgo: 66 },
    ],
  },
  {
    slug: "loose-fit-bermuda-shorts",
    name: "Loose Fit Bermuda Shorts",
    image: "loose-fit-bermuda-shorts.png",
    category: "shorts",
    styles: ["party", "gym"],
    colors: ["blue"],
    sizes: STD_SIZES,
    price: 240,
    compareAt: 300,
    isTopSelling: true,
    description:
      "Knee-length denim shorts with a relaxed leg and a lightly faded finish. Roomy through the thigh without looking baggy.",
    details:
      "Cut from 100% cotton non-stretch denim at 10 oz, with a 28 cm inseam that sits just above the knee. Five-pocket layout, button fly and a turned-up hem that can be worn down for extra length. The fade is achieved by stone washing rather than printing.",
    reviews: [
      { author: "Sam W.", rating: 4, body: "Finally shorts that are actually long enough. The relaxed leg is comfortable in the heat.", daysAgo: 5 },
      { author: "Priyanka B.", rating: 5, body: "Real denim, not the thin stuff. They will clearly last several summers.", daysAgo: 21 },
      { author: "Leon G.", rating: 4, body: "Good fade and solid construction. Waistband runs true to size.", daysAgo: 38 },
      { author: "Nora C.", rating: 5, body: "Bought in the sale and would happily have paid full price.", daysAgo: 57 },
    ],
  },
  {
    slug: "faded-skinny-jeans",
    name: "Faded Skinny Jeans",
    image: "faded-skinny-jeans.png",
    category: "jeans",
    styles: ["formal", "casual"],
    colors: ["black"],
    sizes: STD_SIZES,
    price: 210,
    isTopSelling: true,
    description:
      "A washed black skinny jean with a soft, broken-in surface. Slim through the thigh with a narrow ankle.",
    details:
      "Comfort-stretch denim in 98% cotton and 2% elastane, over-dyed in black and then enzyme washed to soften the surface and lift the colour slightly at the wear points. Zip fly, five pockets and a 13.5 cm leg opening. Wash inside out and cold to slow further fading.",
    reviews: [
      { author: "Dylan F.", rating: 5, body: "The faded black is exactly right — not grey, not flat black. Very comfortable.", daysAgo: 11 },
      { author: "Ayesha M.", rating: 4, body: "Slim but not restrictive. They have kept their shape well after a month.", daysAgo: 28 },
      { author: "Rob S.", rating: 5, body: "Second pair I have owned. They wear in rather than out.", daysAgo: 46 },
      { author: "Clara D.", rating: 4, body: "Great fit, though the ankle is quite narrow if you wear chunky boots.", daysAgo: 69 },
    ],
  },
  {
    slug: "one-life-graphic-t-shirt",
    name: "One Life Graphic T-shirt",
    image: "one-life-graphic-t-shirt.png",
    category: "t-shirts",
    styles: ["casual", "party"],
    colors: ["green", "black", "white"],
    sizes: TEE_SIZES,
    price: 260,
    compareAt: 433,
    description:
      "A boxy olive tee with a layered chest graphic. Heavier cotton with a slightly cropped body and wide sleeves.",
    details:
      "This shirt is 100% cotton, garment dyed in small batches so no two pieces are identical in tone. The chest artwork is printed in three passes to build depth. The body is cut boxy and finished with a twin-needle hem. Cold wash only; garment-dyed cotton will fade if washed warm.",
    reviews: [
      { author: "Yusuf E.", rating: 5, body: "The garment dye gives it real character. Mine came slightly darker than the photo and I like it more for it.", daysAgo: 7 },
      { author: "Tara L.", rating: 4, body: "Beautiful print quality. It is definitely a boxy, cropped cut so check the measurements.", daysAgo: 20 },
      { author: "Hugo N.", rating: 5, body: "Expensive for a tee but the fabric weight justifies it.", daysAgo: 35 },
      { author: "Ellie R.", rating: 4, body: "Lovely colour. Lost half a star because it shrank a touch in length.", daysAgo: 61 },
    ],
  },
  {
    slug: "polo-with-contrast-trims",
    name: "Polo with Contrast Trims",
    image: "polo-with-contrast-trims.png",
    category: "t-shirts",
    styles: ["casual", "formal"],
    colors: ["cyan", "white", "black"],
    sizes: STD_SIZES,
    price: 212,
    compareAt: 265,
    description:
      "A textured piqué polo with a contrast white collar and cuff. Smart enough to wear with chinos, easy enough for the weekend.",
    details:
      "Knitted from mercerised cotton piqué which gives the fabric a subtle sheen and resists pilling. The collar and cuffs are knitted separately in a contrast colour and attached, rather than printed. Three-button placket with mother-of-pearl effect buttons and a split side hem.",
    reviews: [
      { author: "Andre C.", rating: 4, body: "The contrast collar is knitted in properly, not a printed stripe. Holds its shape well.", daysAgo: 10 },
      { author: "Mia H.", rating: 4, body: "Nice piqué texture and a good weight. Colour is a bright teal in daylight.", daysAgo: 27 },
      { author: "Josh P.", rating: 4, body: "Collar stands up after washing, which is my main test for a polo. Passed.", daysAgo: 43 },
      { author: "Sofia G.", rating: 4, body: "Fits true to size. Would buy another colour.", daysAgo: 64 },
    ],
  },
  {
    slug: "gradient-graphic-t-shirt",
    name: "Gradient Graphic T-shirt",
    image: "gradient-graphic-t-shirt.png",
    category: "t-shirts",
    styles: ["casual", "gym"],
    colors: ["white"],
    sizes: TEE_SIZES,
    price: 145,
    description:
      "A white tee with a full-colour gradient graphic across the chest and a small print at the hem.",
    details:
      "Lightweight 160 gsm cotton jersey chosen so the print sits flat without stiffening the shirt. The gradient is reproduced with a digital direct-to-garment process, which holds far more colour steps than a screen print. Wash inside out at 30°C and do not iron directly over the artwork.",
    reviews: [
      { author: "Nikhil V.", rating: 4, body: "The gradient reproduction is genuinely good — smooth, no banding.", daysAgo: 14 },
      { author: "Beth A.", rating: 3, body: "Nice print but the cotton is on the thin side compared to their other tees.", daysAgo: 29 },
      { author: "Omar T.", rating: 4, body: "Light and cool to wear in summer. Print still crisp after a dozen washes.", daysAgo: 47 },
      { author: "Lucy F.", rating: 3, body: "Good shirt, slightly sheer in bright light.", daysAgo: 72 },
    ],
  },
  {
    slug: "polo-with-tipping-details",
    name: "Polo with Tipping Details",
    image: "polo-with-tipping-details.png",
    category: "t-shirts",
    styles: ["casual", "formal"],
    colors: ["pink", "white"],
    sizes: STD_SIZES,
    price: 180,
    description:
      "A fine-stripe polo with tipped collar and cuff edges. A slimmer, dressier cut than a standard piqué polo.",
    details:
      "Yarn-dyed cotton in a fine feeder stripe, with the collar and cuff edges tipped in a contrast yarn. Cut slimmer through the body and sleeve than a classic polo, with a shorter placket. A small embroidered motif sits at the left chest.",
    reviews: [
      { author: "Victor S.", rating: 5, body: "The tipping detail is beautifully done and the stripe is very fine. Looks expensive.", daysAgo: 13 },
      { author: "Anya D.", rating: 4, body: "Slimmer than most polos, which is what I wanted. Check the size guide.", daysAgo: 31 },
      { author: "Felix M.", rating: 5, body: "Excellent knit quality. No pilling under the arms after two months.", daysAgo: 50 },
      { author: "Rina J.", rating: 4, body: "Lovely colour, a dusty rose rather than a bright pink.", daysAgo: 68 },
    ],
  },
  {
    slug: "black-striped-t-shirt",
    name: "Black Striped T-shirt",
    image: "black-striped-t-shirt.png",
    category: "t-shirts",
    styles: ["casual", "party"],
    colors: ["white", "black"],
    sizes: TEE_SIZES,
    price: 120,
    compareAt: 171,
    description:
      "A pinstriped raglan tee with solid black sleeves. Clean baseball styling in a lighter weight cotton.",
    details:
      "Yarn-dyed pinstripe body with contrast raglan sleeves in solid black. The stripe is woven into the cloth so it will not fade unevenly. Ribbed crew neck, twin-needle sleeve and hem finishing. Machine wash cold with like colours.",
    reviews: [
      { author: "Callum B.", rating: 5, body: "Classic shape done properly. The stripe is woven, not printed, which is why it still looks new.", daysAgo: 2 },
      { author: "Meera S.", rating: 5, body: "Great everyday tee and the price is very fair for the quality.", daysAgo: 18 },
      { author: "Tobias K.", rating: 5, body: "Bought two. The raglan sleeve sits really well on the shoulder.", daysAgo: 36 },
      { author: "Aisha Q.", rating: 5, body: "Exactly as pictured and true to size.", daysAgo: 55 },
    ],
  },
  {
    slug: "relaxed-fit-twill-utility-shorts",
    name: "Relaxed Fit Twill Utility Shorts",
    image: "relaxed-fit-twill-utility-shorts.png",
    category: "shorts",
    styles: ["party", "gym"],
    colors: ["yellow", "black"],
    sizes: STD_SIZES,
    price: 260,
    compareAt: 289,
    isTopSelling: true,
    description:
      "Cotton twill cargo shorts with bellowed side pockets and a relaxed leg. Built for actually carrying things.",
    details:
      "Heavy cotton twill with a peached finish, cut with a 30 cm inseam and a roomy thigh. Two bellowed cargo pockets with hook-and-loop flaps, two slant hand pockets and a single welted back pocket. Bar-tacked at every stress point and finished with a branded metal shank.",
    reviews: [
      { author: "Gabriel O.", rating: 5, body: "The pockets are actually usable — phone, wallet and keys all fit without sagging.", daysAgo: 1 },
      { author: "Hannah W.", rating: 5, body: "Really solid twill and the bar tacks are neat. These will outlast everything else I own.", daysAgo: 16 },
      { author: "Isaac L.", rating: 5, body: "Relaxed without being shapeless. Great length too.", daysAgo: 34 },
      { author: "Petra N.", rating: 5, body: "Colour is a soft khaki rather than yellow. Very wearable.", daysAgo: 59 },
    ],
  },
];
