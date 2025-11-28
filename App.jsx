import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Compass, Navigation, Coffee, Smartphone, ChevronRight, Check, X, 
  Globe, Star, Sparkles, Loader, AlertTriangle, MapPin, Radio, 
  ShoppingBag, Camera, Music, PlayCircle, History, Utensils, Search
} from 'lucide-react';

// --- НАСТРОЙКИ КАРТИНОК ---
// ИСПРАВЛЕНО: ПУТИ СОГЛАСОВАНЫ С РАСШИРЕНИЯМИ В РЕПОЗИТОРИИ (.png для скринов)
const IMAGES = {
  // Используем .jpeg для логотипа, как в вашем репозитории
  logo: "/IMG_0289.jpeg",      
  // Скриншоты телефона (ИСПРАВЛЕНО: .png)
  profile: "/IMG_0288.png",    
  map: "/IMG_0275.png",        
};

// --- GEMINI API SETUP ---
const apiKey = typeof process !== 'undefined' && process.env.VITE_GEMINI_API_KEY ? process.env.VITE_GEMINI_API_KEY : ""; 

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyCWQJtzHMksDG5UgLVma8LnYiOxYYcv_AQ",
  authDomain: "guide-du-detour.firebaseapp.com",
  projectId: "guide-du-detour",
  storageBucket: "guide-du-detour.firebasestorage.app",
  messagingSenderId: "182479723840",
  appId: "1:182479723840:web:866963483cf1bca6f9aea5",
  measurementId: "G-17851JKM7F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- СЛОВАРЬ (Multilanguage Strings) ---
const STRINGS = {
    fr: { 
        code: 'FR', label: 'Français', 
        tagline: 'Le guide qui enrichit vos voyages.',
        hero_title_part1: 'Ça vaut le', hero_title_part2: 'détour !',
        join_btn: 'Rejoindre',
        email_placeholder: 'votre@email.com',
        ai_prompt_limit: "Excusez-moi, la recherche est limitée aux régions et villes françaises. Veuillez réessayer avec un nom de lieu en France.",
        ai_scout_prompt: "Tu es un expert local pour l'application 'Guide du Détour'. L'utilisateur indique une région ou une ville de France. Propose UN SEUL lieu précis, méconnu mais atmosphérique (moulin, ruine, plage secrète) dans cette zone. Réponse courte (max 40 mots), inspirante, en français. Commence par le nom du lieu.",
        ai_history_prompt: "Tu es le mode 'Rétroviseur Temporel' de l'application. L'utilisateur donne un lieu ou une région de France. Raconte une courte anecdote historique fascinante, un mythe ou une légende locale oublié sur ce lieu. Ton ton doit être mystérieux et captivant. Max 40 mots. En français.",
        ai_food_prompt: "Tu es le mode 'Coffre Vide' de l'application. L'utilisateur donne une région de France. Liste 3 produits du terroir spécifiques et authentiques (fromage, vin, artisanat) qu'il faut absolument acheter et ramener de là-bas. Format liste simple. En français.",
        tabs: { scout: "L'Éclaireur", history: "Rétroviseur", food: "Coffre Vide" },
        ai_scout_title: "Trouvez une pépite cachée", ai_scout_desc: "Entrez une région, nous trouvons le détour parfait.",
        ai_history_title: "Écoutez les murs parler", ai_history_desc: "Découvrez les légendes oubliées d'un lieu.",
        ai_food_title: "Remplissez votre coffre", ai_food_desc: "Les meilleurs produits locaux à ramener chez vous.",
        ai_placeholder: "Ex: Bretagne ou Lyon...",
        ai_demo_tag: "DÉMONSTRATION IA EN DIRECT", ai_loading: "L'IA consulte ses cartes...", ai_error: "Le serveur est surchargé. Réessayez plus tard.", ai_initial: "Le résultat apparaîtra ici...", ai_mode: "Mode",
        auth_error: "Configuration Firebase requise: Activez l'authentification Anonyme dans la console.",
        hero: { status: 'BETA ACCESSIBLE', subtitle: 'Transformez la route en une aventure fascinante. Définissez votre destination, choisissez votre rayon d\'évasion, et découvrez les trésors cachés le long de votre trajet.' },
        menu: { concept: 'Concept', features: 'Fonctionnalités', future: 'Futur', beta_access: 'Accès Bêta' },
        phone: { interests: 'Vos Intérêts', route: 'La Route' },
        features: { main_title: 'Une expérience unique', main_subtitle: 'Vous choisissez le cap, vous décidez jusqu\'où vous êtes prêt à flâner. Nous nous occupons de l\'émerveillement.', couloir_title: 'Le Couloir', couloir_desc: 'Définissez votre destination et un rayon d\'écart (ex: 5km). Nous trouvons tout ce qui mérite un arrêt dans ce couloir.', univers_title: '4 Univers', univers_desc: 'Fermes & vignobles, Histoire & châteaux, Curiosités locales, Nature. Filtrez selon votre humeur du jour.', chemin_title: 'En Chemin', chemin_desc: 'Ajoutez des étapes à votre itinéraire ou laissez l\'application vous suggérer des arrêts spontanés en roulant.', community_title: 'Communauté', community_desc: 'Chaque lieu a sa fiche détaillée. Vous avez trouvé une pépite ? Ajoutez votre propre découverte pour les autres.' },
        comparison: { title: 'Pourquoi choisir "Ça vaut le détour" ?', function: 'Fonctionnalité', us: 'Nous', others: 'GPS Classique', a_to_b: 'Itinéraire A → B', along_route: 'Découverte le long du trajet (Couloir)', radius: 'Rayon de détour ajustable', categories: 'Catégories pour touristes' },
        roadmap: { tag: 'Roadmap', title: "Le Futur de l'Aventure", subtitle: 'Nous ne construisons pas seulement une carte, mais un compagnon de route intelligent. Voici les modes exclusifs en cours de développement pour nos premiers utilisateurs.', compass_title: 'Mode Boussole', compass_desc: 'Une simple flèche pour les vrais aventuriers. Suivez le cap, trouvez votre propre chemin.', grain_title: 'Grain de la Route', grain_desc: 'Choisissez la texture de votre voyage : routes panoramiques ou chemins de traverse.', chineur_title: 'Mode Chineur', chineur_desc: 'Alertes en temps réel pour les brocantes et vide-greniers sur votre route.', coffre_title: 'Coffre Vide', coffre_desc: 'Remplissez votre coffre de produits locaux : fermiers et artisans en direct.', escale_title: "L'Escale Parfaite", escale_desc: 'Des arrêts synchronisés avec votre fatigue et les plus beaux panoramas.', mystery_title: 'Point Mystère', mystery_desc: 'Laissez-vous guider à l\'aveugle vers une destination surprise.', retro_title: 'Rétroviseur Temporel', retro_desc: 'Des histoires audio géolocalisées qui racontent le passé des lieux traversés.', club_title: 'Club des Éclaireurs', club_desc: 'Gagnez des points, classements et badges en découvrant de nouveaux lieux.' },
        footer: { cta_title: 'Prêt à changer de route ?', cta_subtitle: 'Rejoignez la liste d\'attente pour être parmi les premiers explorateurs à tester l\'application sur iPhone et Android.', copyright: 'Ça vaut le détour. Fait avec passion pour les voyageurs.', privacy: 'Confidentialité', contact: 'Contact' },
        status: { success: 'Inscrit !', success_msg: 'Merci ! On vous tient au courant.' },
    },
    en: { 
        code: 'EN', label: 'English', 
        tagline: 'The guide that enriches your travels.',
        hero_title_part1: 'Worth the', hero_title_part2: 'detour!',
        join_btn: 'Join Now',
        email_placeholder: 'your@email.com',
        ai_prompt_limit: "I'm sorry, the search is limited to regions and cities in France. Please try again with a French location name.",
        ai_scout_prompt: "You are a local expert for the 'Guide du Détour' app. The user provides a region or city in France. Propose ONE specific, little-known but atmospheric place (mill, ruin, secret beach) in that area. Keep the response short (max 40 words), inspiring, and in English. Start with the name of the place.",
        ai_history_prompt: "You are the 'Time Rewinder' mode of the app. The user provides a location in France. Tell a short, fascinating historical anecdote, myth, or forgotten local legend about this place. Your tone should be mysterious and captivating. Max 40 words. In English.",
        ai_food_prompt: "You are the 'Empty Trunk' mode of the app. The user provides a region in France. List 3 specific and authentic local products (cheese, wine, crafts) that they absolutely must buy and bring back from there. Simple list format. In English.",
        tabs: { scout: 'The Scout', history: 'Rewinder', food: 'Empty Trunk' },
        ai_scout_title: "Find a hidden gem", ai_scout_desc: "Enter a region, and we find the perfect detour.",
        ai_history_title: "Listen to the walls talk", ai_history_desc: "Discover the forgotten legends of a place.",
        ai_food_title: "Fill your trunk", ai_food_desc: "The best local products to take home with you.",
        ai_placeholder: "Ex: Provence or Lyon...",
        ai_demo_tag: "LIVE AI DEMONSTRATION", ai_loading: "AI is consulting the maps...", ai_error: "The server is overloaded. Please try again later.", ai_initial: "The result will appear here...", ai_mode: "Mode",
        auth_error: "Firebase configuration required: Enable Anonymous authentication in the console.",
        hero: { status: 'BETA ACCESS', subtitle: 'Transform your journey into a fascinating adventure. Set your destination, choose your radius of escape, and discover hidden treasures along your route.' },
        menu: { concept: 'Concept', features: 'Features', future: 'Future', beta_access: 'Beta Access' },
        phone: { interests: 'Your Interests', route: 'The Route' },
        features: { main_title: 'A unique experience', main_subtitle: 'You choose the course, you decide how far you are willing to wander. We take care of the wonder.', couloir_title: 'The Corridor', couloir_desc: 'Define your destination and a radius of deviation (e.g., 5km). We find everything worth a stop within this corridor.', univers_title: '4 Universes', univers_desc: 'Farms & vineyards, History & castles, Local Curiosities, Nature. Filter according to your mood.', chemin_title: 'On the way', chemin_desc: 'Add stops to your itinerary or let the app suggest spontaneous stops while driving.', community_title: 'Community', community_desc: 'Every place has its detailed sheet. Found a gem? Add your own discovery for others.' },
        comparison: { title: 'Why choose "Worth the detour" ?', function: 'Functionality', us: 'Us', others: 'Classic GPS', a_to_b: 'A → B Route', along_route: 'Discovery along the route (Corridor)', radius: 'Adjustable detour radius', categories: 'Tourist categories' },
        roadmap: { tag: 'Roadmap', title: 'The Future of Adventure', subtitle: 'We are not just building a map, but an intelligent road companion. Here are the exclusive modes currently in development for our first users.', compass_title: 'Compass Mode', compass_desc: 'A simple arrow for true adventurers. Follow the heading, find your own way.', grain_title: 'Road Grain', grain_desc: 'Choose the texture of your journey: scenic routes or cross roads.', chineur_title: 'Chineur Mode', chineur_desc: 'Real-time alerts for flea markets and garage sales on your route.', coffre_title: 'Empty Trunk', coffre_desc: 'Fill your trunk with local products: directly from farmers and artisans.', escale_title: 'The Perfect Stopover', escale_desc: 'Stops synchronized with your fatigue and the most beautiful panoramas.', mystery_title: 'Mystery Point', mystery_desc: 'Let yourself be guided blindly to a surprise destination.', retro_title: 'Time Rewinder', retro_desc: 'Geolocation audio stories that tell the past of the places crossed.', club_title: 'Explorers Club', club_desc: 'Earn points, rankings, and badges by discovering new places.' },
        footer: { cta_title: 'Ready to change route?', cta_subtitle: 'Join the waiting list to be among the first explorers to test the app on iPhone and Android.', copyright: 'Worth the Detour. Made with passion for travelers.', privacy: 'Privacy', contact: 'Contact' },
        status: { success: 'Signed Up!', success_msg: 'Thank you! We will keep you updated.' },
    },
    de: { 
        code: 'DE', label: 'Deutsch', 
        tagline: 'Der Reiseführer, der Ihre Reisen bereichert.',
        hero_title_part1: 'Der Abstecher', hero_title_part2: 'lohnt sich!',
        join_btn: 'Jetzt beitreten',
        email_placeholder: 'ihre@email.de',
        ai_prompt_limit: "Entschuldigung, die Suche ist auf französische Regionen und Städte beschränkt. Bitte versuchen Sie es mit einem französischen Ortsnamen erneut.",
        ai_scout_prompt: "Sie sind ein lokaler Experte für die App 'Guide du Détour'. Der Benutzer gibt eine Region oder Stadt in Frankreich an. Schlagen Sie EINEN spezifischen, wenig bekannten, aber atmosphärischen Ort (Mühle, Ruine, Geheimstrand) in dieser Gegend vor. Die Antwort soll kurz (max. 40 Wörter), inspirierend und auf Deutsch sein. Beginnen Sie mit dem Namen des Ortes.",
        ai_history_prompt: "Sie sind der 'Zeit-Rückspiegel'-Modus der App. Der Benutzer gibt einen Ort in Frankreich an. Erzählen Sie eine kurze, faszinierende historische Anekdote, einen Mythos oder eine vergessene lokale Legende über diesen Ort. Ihr Ton soll geheimnisvoll und fesselnd sein. Max 40 Wörter. Auf Deutsch.",
        ai_food_prompt: "Sie sind der 'Leerer Kofferraum'-Modus der App. Der Benutzer gibt eine Region in Frankreich an. Listen Sie 3 spezifische und authentische lokale Produkte (Käse, Wein, Handwerk) auf, die man unbedingt dort kaufen und mitbringen muss. Einfaches Listenformat. Auf Deutsch.",
        tabs: { scout: 'Der Pfadfinder', history: 'Rückspiegel', food: 'Leerer Kofferraum' },
        ai_scout_title: "Finden Sie ein verstecktes Juwel", ai_scout_desc: "Geben Sie eine Region ein, und wir finden den perfekten Abstecher für Sie.",
        ai_history_title: "Hören Sie die Mauern sprechen", ai_history_desc: "Entdecken Sie die vergessenen Legenden eines Ortes.",
        ai_food_title: "Füllen Sie Ihren Kofferraum", ai_food_desc: "Die besten lokalen Produkte, die Sie mit nach Hause nehmen können.",
        ai_placeholder: "Bsp.: Normandie oder Paris...",
        ai_demo_tag: "LIVE AI DEMONSTRATION", ai_loading: "Die KI konsultiert die Karten...", ai_error: "Der Server ist überlastet. Bitte versuchen Sie es später erneut.", ai_initial: "Das Ergebnis wird hier angezeigt...", ai_mode: "Modus",
        auth_error: "Firebase-Konfiguration erforderlich: Aktivieren Sie die anonyme Authentifizierung in der Konsole.",
        hero: { status: 'BETA-ZUGANG', subtitle: 'Verwandeln Sie Ihre Fahrt in ein faszinierendes Abenteuer. Legen Sie Ihr Ziel fest, wählen Sie Ihren Fluchtradius und entdecken Sie verborgene Schätze entlang Ihrer Route.' },
        menu: { concept: 'Konzept', features: 'Funktionen', future: 'Zukunft', beta_access: 'Beta-Zugang' },
        phone: { interests: 'Ihre Interessen', route: 'Die Route' },
        features: { main_title: 'Ein einzigartiges Erlebnis', main_subtitle: 'Sie wählen den Kurs, Sie entscheiden, wie weit Sie abschweifen möchten. Wir kümmern uns um das Wunder.', couloir_title: 'Der Korridor', couloir_desc: 'Definieren Sie Ihr Ziel und einen Abweichungsradius (z. B. 5 km). Wir finden alles, was innerhalb dieses Korridors einen Stopp wert ist.', univers_title: '4 Universen', univers_desc: 'Bauernhöfe & Weinberge, Geschichte & Schlösser, lokale Kuriositäten, Natur. Filtern Sie nach Ihrer Stimmung.', chemin_title: 'Unterwegs', chemin_desc: 'Fügen Sie Zwischenstopps zu Ihrer Route hinzu oder lassen Sie sich von der App spontane Haltepunkte vorschlagen.', community_title: 'Gemeinschaft', community_desc: 'Jeder Ort hat sein detailliertes Blatt. Haben Sie ein Juwel gefunden? Fügen Sie Ihre eigene Entdeckung für andere hinzu.' },
        comparison: { title: 'Warum wählen Sie "Der Abstecher lohnt sich" ?', function: 'Funktionalität', us: 'Wir', others: 'Klassisches GPS', a_to_b: 'A → B Route', along_route: 'Entdeckung entlang der Route (Korridor)', radius: 'Einstellbarer Abstecher-Radius', categories: 'Touristenkategorien' },
        roadmap: { tag: 'Roadmap', title: 'Die Zukunft des Abenteuers', subtitle: 'Wir bauen nicht nur eine Karte, sondern einen intelligenten Reisebegleiter. Hier sind die exklusiven Modi, die sich derzeit für unsere ersten Benutzer in Entwicklung befinden.', compass_title: 'Kompass-Modus', compass_desc: 'Ein einfacher Pfeil für echte Abenteurer. Folgen Sie dem Kurs, finden Sie Ihren eigenen Weg.', grain_title: 'Körnung der Straße', grain_desc: 'Wählen Sie die Textur Ihrer Reise: Panoramastraßen oder Querstraßen.', chineur_title: 'Chineur-Modus', chineur_desc: 'Echtzeit-Warnungen für Flohmärkte und Garagenverkäufe auf Ihrer Route.', coffre_title: 'Leerer Kofferraum', coffre_desc: 'Füllen Sie Ihren Kofferraum mit lokalen Produkten: direkt von Bauern und Handwerkern.', escale_title: 'Der perfekte Zwischenstopp', escale_desc: 'Stopps synchronisiert mit Ihrer Müdigkeit und den schönsten Panoramen.', mystery_title: 'Geheimnisvoller Punkt', mystery_desc: 'Lassen Sie sich blind zu einem Überraschungsziel führen.', retro_title: 'Zeit-Rückspiegel', retro_desc: 'Geolokalisierte Audio-Geschichten, die die Vergangenheit der durchquerten Orte erzählen.', club_title: 'Entdecker-Club', club_desc: 'Sammeln Sie Punkte, Ranglisten und Abzeichen, indem Sie neue Orte entdecken.' },
        footer: { cta_title: 'Bereit für einen Routenwechsel?', cta_subtitle: 'Tragen Sie sich in die Warteliste ein, um zu den ersten Entdeckern zu gehören, die die App auf iPhone und Android testen.', copyright: 'Der Abstecher lohnt sich. Mit Leidenschaft für Reisende gemacht.', privacy: 'Datenschutz', contact: 'Kontakt' },
        status: { success: 'Angemeldet!', success_msg: 'Vielen Dank! Wir halten Sie auf dem Laufenden.' },
    },
    nl: { 
        code: 'NL', label: 'Nederlands', 
        tagline: 'De gids die uw reizen verrijkt.',
        hero_title_part1: 'De omweg is', hero_title_part2: 'de moeite waard!',
        join_btn: 'Nu lid worden',
        email_placeholder: 'uw@email.nl',
        ai_prompt_limit: "Excuses, het zoeken is beperkt tot Franse regio's en steden. Probeer het opnieuw met een Franse plaatsnaam.",
        ai_scout_prompt: "U bent een lokale expert voor de 'Guide du Détour'-app. De gebruiker geeft een regio of stad in Frankrijk op. Stel EEN specifieke, weinig bekende maar sfeervolle plek (molen, ruïne, geheim strand) in die omgeving voor. Het antwoord moet kort (max 40 woorden), inspirerend en in het Nederlands zijn. Begin met de naam van de plaats.",
        ai_history_prompt: "U bent de 'Tijdspiegel'-modus van de app. De gebruiker geeft een locatie in Frankrijk op. Vertel een korte, fascinerende historische anekdote, mythe of vergeten lokale legende over deze plek. Uw toon moet mysterieus en meeslepend zijn. Max 40 woorden. In het Nederlands.",
        ai_food_prompt: "U bent de 'Lege Kofferbak'-modus van de app. De gebruiker geeft een regio in Frankrijk op. Noem 3 specifieke en authentieke lokale producten (kaas, wijn, ambachten) die men daar absoluut moet kopen en meenemen. Eenvoudig lijstformaat. In het Nederlands.",
        tabs: { scout: 'De Verkenner', history: 'Tijdspiegel', food: 'Lege Kofferbak' },
        ai_scout_title: "Vind een verborgen parel", ai_scout_desc: "Voer een regio in, en wij vinden de perfecte omweg voor u.",
        ai_history_title: "Luister naar de muren", ai_history_desc: "Ontdek de vergeten legendes van een plek.",
        ai_food_title: "Vul uw kofferbak", ai_food_desc: "De beste lokale producten om mee naar huis te nemen.",
        ai_placeholder: "Bv.: Normandië of Lyon...",
        ai_demo_tag: "LIVE AI DEMONSTRATIE", ai_loading: "AI raadpleegt de kaarten...", ai_error: "De server is overbelast. Probeer later opnieuw.", ai_initial: "Het resultaat verschijnt hier...", ai_mode: "Modus",
        auth_error: "Firebase-configuratie vereist: Schakel anonieme authenticatie in de console in.",
        hero: { status: 'BETA TOEGANG', subtitle: 'Verander uw reis in een fascinerend avontuur. Stel uw bestemming in, kies uw ontsnappingsradius en ontdek verborgen schatten langs uw route.' },
        menu: { concept: 'Concept', features: 'Functies', future: 'Toekomst', beta_access: 'Beta Toegang' },
        phone: { interests: 'Uw interesses', route: 'De Route' },
        features: { main_title: 'Een unieke ervaring', main_subtitle: 'U kiest de koers, u beslist hoe ver u wilt afdwalen. Wij zorgen voor de verwondering.', couloir_title: 'De Corridor', couloir_desc: 'Definieer uw bestemming en een afwijkingsradius (bijv. 5 km). We vinden alles wat binnen deze corridor een stop waard is.', univers_title: '4 Universa', univers_desc: 'Boerderijen & wijngaarden, Geschiedenis & kastelen, lokale curiosa, Natuur. Filter op basis van uw stemming.', chemin_title: 'Onderweg', chemin_desc: 'Voeg tussenstops toe aan uw route of laat de app spontane stopplaatsen voorstellen tijdens het rijden.', community_title: 'Gemeenschap', community_desc: 'Elke plaats heeft zijn gedetailleerde fiche. Een parel gevonden? Voeg uw eigen ontdekking toe voor anderen.' },
        comparison: { title: 'Waarom kiezen voor "De omweg is de moeite waard"?', function: 'Functionaliteit', us: 'Wij', others: 'Klassieke GPS', a_to_b: 'A → B Route', along_route: 'Ontdekking langs de route (Corridor)', radius: 'Instelbare omwegradius', categories: 'Toeristische categorieën' },
        roadmap: { tag: 'Roadmap', title: 'De Toekomst van Avontuur', subtitle: 'We bouwen niet alleen een kaart, maar een intelligente reisgenoot. Hier zijn de exclusieve modi die momenteel in ontwikkeling zijn voor onze eerste gebruikers.', compass_title: 'Kompas Modus', compass_desc: 'Een eenvoudige pijl voor echte avonturiers. Volg de koers, vind uw eigen weg.', grain_title: 'Korrel van de Route', grain_desc: 'Kies de textuur van uw reis: schilderachtige routes of binnenwegen.', chineur_title: 'Chineur Modus', chineur_desc: 'Realtime meldingen voor rommelmarkten en garageverkopen op uw route.', coffre_title: 'Lege Kofferbak', coffre_desc: 'Vul uw kofferbak met lokale producten: direct van boeren en ambachtslieden.', escale_title: 'De Perfecte Tussenstop', escale_desc: 'Stops gesynchroniseerd met uw vermoeidheid en de mooiste panorama\'s.', mystery_title: 'Mysterie Punt', mystery_desc: 'Laat u blindelings naar een verrassingsbestemming leiden.', retro_title: 'Tijdspiegel', retro_desc: 'Geolocatie audioverhalen die het verleden van de doorkruiste plaatsen vertellen.', club_title: 'Explorers Club', club_desc: 'Verdien punten, ranglijsten en badges door nieuwe plaatsen te ontdekken.' },
        footer: { cta_title: 'Klaar om van route te veranderen?', cta_subtitle: 'Word lid van de wachtlijst om bij de eerste ontdekkingsreizigers te zijn die de app testen op iPhone en Android.', copyright: 'De omweg is de moeite waard. Met passie gemaakt voor reizigers.', privacy: 'Privacy', contact: 'Contact' },
        status: { success: 'Aangemeld!', success_msg: 'Bedankt! We houden u op de hoogte.' },
    },
    ru: { 
        code: 'RU', label: 'Русский', 
        tagline: 'Гид, который обогатит ваше путешествие.',
        hero_title_part1: 'Стоит сделать', hero_title_part2: 'крюк!',
        join_btn: 'Присоединиться',
        email_placeholder: 'ваша@почта.ru',
        ai_prompt_limit: "Извините, поиск ограничен регионами и городами Франции. Пожалуйста, попробуйте ввести название местности во Франции.",
        ai_scout_prompt: "Вы — местный эксперт приложения 'Guide du Détour'. Пользователь указывает регион или город во Франции. Предложите ОДНО конкретное, малоизвестное, но атмосферное место (мельница, руины, секретный пляж) в этой зоне. Ответ должен быть кратким (максимум 40 слов), вдохновляющим и на русском языке. Начните ответ с названия места.",
        ai_history_prompt: "Вы — режим 'Ретровизор Времени' приложения. Пользователь дает место или регион во Франции. Расскажите короткую, увлекательную историческую байку, миф или забытую местную легенду об этом месте. Ваш тон должен быть таинственным и захватывающим. Макс 40 слов. На русском языке.",
        ai_food_prompt: "Вы — режим 'Пустой Багажник' приложения. Пользователь дает регион во Франции. Перечислите 3 специфических и аутентичных местных продукта (сыр, вино, ремесла), которые стоит обязательно купить и привезти оттуда. Формат простого списка. На русском языке.",
        tabs: { scout: 'Разведчик', history: 'Ретровизор', food: 'Пустой Багажник' },
        ai_scout_title: "Найдите скрытую жемчужину", ai_scout_desc: "Введите регион, и мы найдем идеальный крюк для вас.",
        ai_history_title: "Послушайте, что говорят стены", ai_history_desc: "Откройте для себя забытые легенды места.",
        ai_food_title: "Наполните ваш багажник", ai_food_desc: "Лучшие местные продукты, чтобы забрать их домой.",
        ai_placeholder: "Например: Прованс или Лион...",
        ai_demo_tag: "ЖИВАЯ AI ДЕМОНСТРАЦИЯ", ai_loading: "AI консультирует карты...", ai_error: "Сервер перегружен. Пожалуйста, повторите попытку позже.", ai_initial: "Результат появится здесь...", ai_mode: "Режим",
        auth_error: "Требуется настройка Firebase: Включите анонимную аутентификацию в консоли.",
        hero: { status: 'БЕТА ДОСТУПЕН', hero_title_part1: 'Стоит сделать', hero_title_part2: 'крюк!', subtitle: 'Превратите свою поездку в увлекательное приключение. Установите пункт назначения, выберите радиус отклонения и откройте скрытые сокровища вдоль вашего маршрута.' },
        menu: { concept: 'Концепт', features: 'Функции', future: 'Будущее', beta_access: 'Бета Доступ' },
        phone: { interests: 'Ваши интересы', route: 'Маршрут' },
        features: { main_title: 'Уникальный опыт', main_subtitle: 'Вы выбираете курс, вы решаете, как далеко готовы отклониться. Мы позаботимся об удивлении.', couloir_title: 'Коридор', couloir_desc: 'Определите пункт назначения и радиус отклонения (например, 5 км). Мы найдем все, что стоит остановки в пределах этого коридора.', univers_title: '4 Вселенные', univers_desc: 'Фермы и винодельни, История и замки, Местные диковинки, Природа. Фильтруйте в соответствии с вашим настроением.', chemin_title: 'По пути', chemin_desc: 'Добавьте остановки к своему маршруту или позвольте приложению предлагать спонтанные остановки во время движения.', community_title: 'Сообщество', community_desc: 'У каждого места есть своя подробная карточка. Нашли жемчужину? Добавьте свое открытие для других.' },
        comparison: { title: 'Почему стоит выбрать "Стоит сделать крюк!"?', function: 'Функциональность', us: 'Мы', others: 'Классический GPS', a_to_b: 'Маршрут A → B', along_route: 'Обнаружение вдоль маршрута (Коридор)', radius: 'Настраиваемый радиус отклонения', categories: 'Туристические категории' },
        roadmap: { tag: 'Дорожная карта', title: 'Будущее приключений', subtitle: 'Мы строим не просто карту, а умного спутника в дороге. Вот эксклюзивные режимы, которые сейчас разрабатываются для наших первых пользователей.', compass_title: 'Режим Компаса', compass_desc: 'Простая стрелка для настоящих авантюристов. Следуйте курсу, найдите свой собственный путь.', grain_title: 'Зерно Дороги', grain_desc: 'Выберите текстуру вашего путешествия: живописные маршруты или проселочные дороги.', chineur_title: 'Режим Кладоискателя', chineur_desc: 'Уведомления в реальном времени о блошиных рынках и распродажах на вашем маршруте.', coffre_title: 'Пустой Багажник', coffre_desc: 'Наполните свой багажник местными продуктами: напрямую от фермеров и ремесленников.', escale_title: 'Идеальный Привал', escale_desc: 'Остановки, синхронизированные с вашей усталостью и самыми красивыми видами.', mystery_title: 'Точка-Сюрприз', mystery_desc: 'Позвольте себе быть направленным вслепую к неожиданному месту назначения.', retro_title: 'Ретровизор Времени', retro_desc: 'Геолокационные аудиоистории, рассказывающие о прошлом пересекаемых мест.', club_title: 'Клуб Следопытов', club_desc: 'Зарабатывайте баллы, рейтинги и значки, открывая новые места.' },
        footer: { cta_title: 'Готовы сменить маршрут?', cta_subtitle: 'Присоединяйтесь к листу ожидания, чтобы быть среди первых исследователей, тестирующих приложение на iPhone и Android.', copyright: 'Стоит сделать крюк. Создано с любовью для путешественников.', privacy: 'Конфиденциальность', contact: 'Контакты' },
        status: { success: 'Готово!', success_msg: 'Спасибо! Мы будем держать вас в курсе.' },
    },
};


// --- LANGUAGE HOOK ---
const useLanguage = () => {
    // 1. Попытка определить язык браузера (только при первом запуске)
    const getInitialLang = () => {
        const storedLang = localStorage.getItem('lang');
        if (storedLang && STRINGS[storedLang]) {
            return storedLang;
        }

        const browserLangCode = navigator.language.split('-')[0];
        const defaultLangMap = {
            'fr': 'fr', 'en': 'en', 'de': 'de', 'nl': 'nl', 'ru': 'ru'
        };
        return defaultLangMap[browserLangCode] || 'fr';
    };

    const [lang, setLang] = useState(getInitialLang);

    // 2. Сохраняем в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    const strings = STRINGS[lang];
    const setLanguage = (newLang) => {
        if (STRINGS[newLang]) {
            setLang(newLang);
        }
    };

    return { lang, strings, setLanguage };
};

// --- COMPONENTS ---

const Logo = () => {
    // Используем логотип из IMAGES.logo, который теперь ссылается на IMG_0289.jpeg
    return (
        <div className="flex items-center justify-start py-2">
            <img 
              src={IMAGES.logo} 
              alt="Guide du Détour" 
              className="h-16 md:h-24 w-auto object-contain transition-transform duration-500 hover:scale-105" 
            />
        </div>
    );
};

const LanguageSwitcher = () => {
    const { lang, setLanguage } = useLanguage();
    const languages = Object.values(STRINGS);

    return (
        <div className="relative">
            <select
                onChange={(e) => setLanguage(e.target.value)}
                value={lang}
                className="bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-full border border-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
                {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                        {l.label} ({l.code})
                    </option>
                ))}
            </select>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description, color = "text-emerald-400" }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 group h-full hover:-translate-y-1 shadow-lg hover:shadow-emerald-900/10">
    <div className={`w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
  </div>
);

const RoadmapItem = ({ emoji, title, desc }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10">
    <div className="text-2xl pt-1 select-none">{emoji}</div>
    <div>
        <h4 className="text-white font-bold text-sm md:text-base mb-1">{title}</h4>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ComparisonRow = ({ feature, us, others }) => (
  <div className="grid grid-cols-12 gap-2 md:gap-4 py-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors px-4 rounded-lg items-center">
    <div className="col-span-6 text-slate-300 font-medium text-xs md:text-sm">{feature}</div>
    <div className="col-span-3 text-center flex justify-center">
        {us ? <Check className="text-emerald-400 w-5 h-5" /> : <X className="text-slate-600 w-5 h-5" />}
    </div>
    <div className="col-span-3 text-center flex justify-center opacity-50 grayscale">
        {others ? <Check className="text-slate-400 w-5 h-5" /> : <X className="text-slate-600 w-5 h-5" />}
    </div>
  </div>
);

// --- AI LAB COMPONENT ---
const AiLab = () => {
    const { strings, lang } = useLanguage();
    const [activeTab, setActiveTab] = useState('scout');
    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setResult(null);
        setError(null);
        setInput('');
    }, [activeTab]);

    const getSystemPrompt = (tab, input) => {
        // 1. Проверка на стоп-слова
        const nonGeoKeywords = ['президент', 'president', 'bundeskanzler', 'koning', 'политика', 'politics', 'geschichte', 'history', 'recette', 'recipe'];
        if (nonGeoKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
            return strings.ai_prompt_limit;
        }

        // 2. Выбор промпта по вкладке
        switch (tab) {
            case 'scout':
                return strings.ai_scout_prompt;
            case 'history':
                return strings.ai_history_prompt;
            case 'food':
                return strings.ai_food_prompt;
            default:
                return strings.ai_scout_prompt;
        }
    };
    
    // Эвристическая проверка на стороне клиента
    const isFrenchLocation = (text) => {
        const textLower = text.toLowerCase();
        return textLower.trim().length > 3; 
    }


    const handleAction = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        // Дополнительная проверка на стороне клиента для быстрой обратной связи
        if (!isFrenchLocation(input)) {
             setError(strings.ai_prompt_limit);
             return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const systemPrompt = getSystemPrompt(activeTab, input);

        // Если функция getSystemPrompt вернула сообщение об ошибке (ограничение)
        if (systemPrompt === strings.ai_prompt_limit) {
             setError(systemPrompt);
             setLoading(false);
             return;
        }

        // ВНИМАНИЕ: Если apiKey пуст, запрос упадет
        if (!apiKey) {
             setError("Ошибка: Ключ Gemini API не установлен (VITE_GEMINI_API_KEY).");
             setLoading(false);
             return;
        }


        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Исправленная структура запроса для systemInstruction
                    contents: [{ 
                        role: "user",
                        parts: [{ text: `Location: ${input}` }] 
                    }],
                    config: { 
                        systemInstruction: systemPrompt 
                    }
                })
            });

            if (!response.ok) {
                setError(strings.ai_error);
                throw new Error(`AI busy/limit reached: ${response.statusText}`);
            }
            
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                 // Дополнительная проверка на нарушение правил
                 const textLower = text.toLowerCase();
                 if (textLower.includes("sorry") || textLower.includes("pardon") || textLower.includes("entschuldigung") || textLower.includes("извините") || textLower.includes("france only") ) {
                    setError(strings.ai_prompt_limit);
                 } else {
                    setResult(text);
                 }
            } else {
                setError(strings.ai_error);
            }
        } catch (err) {
            console.error(err);
            if (err.message.includes('Failed to fetch')) {
                 setError("Ошибка сети. Проверьте ваш API ключ или настройки CORS.");
            } else {
                setError(strings.ai_error);
            }
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'scout', icon: Compass, label: strings.tabs.scout, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
        { id: 'history', icon: History, label: strings.tabs.history, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
        { id: 'food', icon: ShoppingBag, label: strings.tabs.food, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" }
    ];
    const activeTabData = tabs.find(t => t.id === activeTab);

    return (
        <div className="w-full max-w-2xl mx-auto mt-20 rounded-2xl bg-gradient-to-b from-slate-800 to-[#0b1021] p-[1px] shadow-2xl shadow-emerald-900/20">
            <div className="bg-[#0b1021] rounded-[15px] overflow-hidden">
                <div className="bg-slate-900/50 p-2 flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `${tab.bg} ${tab.color} ring-1 ring-inset ${tab.border}` : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
                <div className="p-6 md:p-10 text-center min-h-[300px] flex flex-col">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-6 mx-auto">
                        <Sparkles size={10} className={activeTabData.color} /> {strings.ai_demo_tag}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {activeTab === 'scout' && strings.ai_scout_title}
                        {activeTab === 'history' && strings.ai_history_title}
                        {activeTab === 'food' && strings.ai_food_title}
                    </h3>
                    <p className="text-slate-400 mb-8 text-sm">
                        {activeTab === 'scout' && strings.ai_scout_desc}
                        {activeTab === 'history' && strings.ai_history_desc}
                        {activeTab === 'food' && strings.ai_food_desc}
                    </p>
                    <form onSubmit={handleAction} className="flex flex-col md:flex-row gap-3 max-w-md mx-auto w-full mb-8 relative z-10">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={strings.ai_placeholder} className="flex-1 bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-slate-500 transition placeholder-slate-600" />
                        <button type="submit" disabled={loading || !input} className={`text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${activeTab === 'scout' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : ''} ${activeTab === 'history' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : ''} ${activeTab === 'food' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : ''}`}>
                            {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                        </button>
                    </form>
                    <div className="flex-1 flex items-center justify-center">
                        {loading && <div className={`${activeTabData.color} opacity-50 animate-pulse text-sm`}>{strings.ai_loading}</div>}
                        {error && <div className="text-red-400 text-sm">{error}</div>}
                        {result && (
                            <div className={`relative bg-slate-800/30 border rounded-xl p-6 animate-fade-in text-left w-full ${activeTabData.border}`}>
                                <p className="text-slate-200 italic leading-relaxed text-lg">"{result}"</p>
                                <div className={`mt-4 text-xs font-bold uppercase tracking-widest text-right ${activeTabData.color}`}>{strings.ai_mode} {activeTabData.label}</div>
                            </div>
                        )}
                        {!loading && !result && !error && <div className="text-slate-700 text-sm italic">{strings.ai_initial}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PHONE MOCKUP ---
const PhoneMockup = ({ activeScreen, setActiveScreen }) => {
    const { strings } = useLanguage();
    const screens = [
        {
            id: 'profile',
            title: strings.phone.interests,
            src: IMAGES.profile,  
            alt: 'Ecran profil avec intérêts'
        },
        {
            id: 'map',
            title: strings.phone.route,
            src: IMAGES.map, 
            alt: 'Ecran navigation carte'
        }
    ];

    const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];

    return (
        <div className="relative mx-auto border-slate-800 bg-slate-900 border-[14px] rounded-[2.5rem] h-[640px] w-[320px] shadow-2xl flex flex-col items-center justify-start z-20 transition-all duration-500 hover:scale-[1.02]">
            <div className="w-[148px] h-[24px] bg-slate-900 absolute top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 z-30"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-950 relative">
                <div className="absolute top-0 w-full h-12 flex justify-between items-center px-6 text-white text-xs font-bold z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <span>22:07</span>
                    <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full border border-white/20 bg-white/10"></div>
                        <div className="w-4 h-4 rounded-full border border-white/20 bg-white"></div>
                    </div>
                </div>
                <div className="w-full h-full relative">
                    <img src={currentScreen.src} alt={currentScreen.alt} className="w-full h-full object-cover transition-opacity duration-500" />
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
const App = () => {
  const { lang, strings, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [user, setUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState('profile');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        setAuthError(null);
      } catch (err) {
        console.error("Auth failed:", err);
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
            setAuthError(strings.auth_error);
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const uid = user ? user.uid : 'anonymous_guest';
    try {
      await addDoc(collection(db, 'waitlist'), {
        email,
        timestamp: serverTimestamp(),
        source: `landing_page_${lang}`,
        uid: uid
      });
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error("Error:", error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden scroll-smooth">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
      </div>
      <div className="relative z-10">
        {authError && (
            <div className="bg-orange-500/10 border-b border-orange-500/20 text-orange-200 px-6 py-2 text-center text-xs">
                <AlertTriangle size={14} className="inline mr-2" />
                {authError}
            </div>
        )}
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center bg-[#050816]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
          <Logo />
          <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
                <a href="#concept" className="hover:text-white transition">{strings.menu.concept}</a>
                <a href="#features" className="hover:text-white transition">{strings.menu.features}</a>
                <a href="#roadmap" className="hover:text-emerald-400 transition">{strings.menu.future}</a>
              </div>
              <a href="#join" className="bg-white/5 hover:bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full border border-white/10 transition">
                {strings.menu.beta_access}
              </a>
              <LanguageSwitcher />
          </div>
        </nav>
        <header className="container mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {strings.hero.status}
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-[1.1] tracking-tight">
                {strings.hero.hero_title_part1} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 italic pr-2">{strings.hero.hero_title_part2}</span>
              </h1>
              <p className="text-xl text-slate-400 mb-2 font-medium">{strings.tagline}</p>
              <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {strings.hero.subtitle}
              </p>
              <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto lg:mx-0 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                <div className="relative flex shadow-2xl">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={strings.email_placeholder} className="w-full bg-[#0b1021] text-white placeholder-slate-500 px-6 py-4 rounded-l-lg border border-r-0 border-slate-700 focus:outline-none focus:border-emerald-500/50 transition-all text-center md:text-left" required />
                  <button type="submit" disabled={status === 'loading' || status === 'success'} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-4 rounded-r-lg transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-70">
                    {status === 'loading' ? '...' : status === 'success' ? strings.status.success : strings.join_btn}
                    {status === 'idle' && <ChevronRight size={18} />}
                  </button>
                </div>
                {status === 'success' && <p className="absolute -bottom-8 left-0 text-emerald-400 text-sm flex items-center gap-1 animate-fade-in"><Check size={14} /> {strings.status.success_msg}</p>}
              </form>
            </div>
            <div className="flex-1 relative flex flex-col items-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-full blur-[80px] -z-10"></div>
                <PhoneMockup activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
                <div className="mt-8 flex gap-4">
                    <button onClick={() => setActiveScreen('profile')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeScreen === 'profile' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-900/20' : 'bg-transparent text-slate-500 hover:text-white'}`}>{strings.phone.interests}</button>
                    <button onClick={() => setActiveScreen('map')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeScreen === 'map' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-900/20' : 'bg-transparent text-slate-500 hover:text-white'}`}>{strings.phone.route}</button>
                </div>
            </div>
          </div>
        </header>
        <section id="concept" className="py-24 bg-[#02040a] relative overflow-hidden">
           <div className="container mx-auto px-6 relative z-10">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                 <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">{strings.features.main_title}</h2>
                 <p className="text-slate-400 text-lg">{strings.features.main_subtitle}</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                 <FeatureCard icon={Navigation} title={strings.features.couloir_title} description={strings.features.couloir_desc} color="text-blue-400" />
                 <FeatureCard icon={Compass} title={strings.features.univers_title} description={strings.features.univers_desc} color="text-amber-400" />
                 <FeatureCard icon={MapPin} title={strings.features.chemin_title} description={strings.features.chemin_desc} color="text-emerald-400" />
                 <FeatureCard icon={Camera} title={strings.features.community_title} description={strings.features.community_desc} color="text-purple-400" />
              </div>
              <div className="bg-[#0b1021] rounded-2xl border border-slate-800 p-8 max-w-4xl mx-auto">
                 <h3 className="text-center text-white font-bold mb-8">{strings.comparison.title}</h3>
                 <div className="grid grid-cols-12 gap-2 md:gap-4 pb-4 border-b border-slate-800 px-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <div className="col-span-6">{strings.comparison.function}</div>
                    <div className="col-span-3 text-center text-emerald-400">{strings.comparison.us}</div>
                    <div className="col-span-3 text-center">{strings.comparison.others}</div>
                 </div>
                 <ComparisonRow feature={strings.comparison.a_to_b} us={true} others={true} />
                 <ComparisonRow feature={strings.comparison.along_route} us={true} others={false} />
                 <ComparisonRow feature={strings.comparison.radius} us={true} others={false} />
                 <ComparisonRow feature={strings.comparison.categories} us={true} others={false} />
              </div>
           </div>
        </section>
        <section id="roadmap" className="py-24 bg-gradient-to-b from-[#02040a] to-[#050816]">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                    <div className="flex-1">
                        <div className="inline-block px-3 py-1 mb-4 border border-indigo-500/30 rounded-full bg-indigo-900/20 text-indigo-300 text-xs font-bold tracking-widest uppercase">{strings.roadmap.tag}</div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">{strings.roadmap.title}</h2>
                        <p className="text-slate-400 text-lg leading-relaxed">{strings.roadmap.subtitle}</p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <RoadmapItem emoji="🧭" title={strings.roadmap.compass_title} desc={strings.roadmap.compass_desc} />
                            <RoadmapItem emoji="🛣️" title={strings.roadmap.grain_title} desc={strings.roadmap.grain_desc} />
                            <RoadmapItem emoji="🏺" title={strings.roadmap.chineur_title} desc={strings.roadmap.chineur_desc} />
                            <RoadmapItem emoji="🧀" title={strings.roadmap.coffre_title} desc={strings.roadmap.coffre_desc} />
                            <RoadmapItem emoji="⏸️" title={strings.roadmap.escale_title} desc={strings.roadmap.escale_desc} />
                            <RoadmapItem emoji="🏰" title={strings.roadmap.mystery_title} desc={strings.roadmap.mystery_desc} />
                            <RoadmapItem emoji="🎧" title={strings.roadmap.retro_title} desc={strings.roadmap.retro_desc} />
                            <RoadmapItem emoji="⭐️" title={strings.roadmap.club_title} desc={strings.roadmap.club_desc} />
                        </div>
                    </div>
                </div>
                <AiLab />
            </div>
        </section>
        <footer id="join" className="py-24 text-center container mx-auto px-6 relative overflow-hidden bg-[#050816]">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>
           <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">{strings.footer.cta_title}</h2>
           <p className="text-slate-400 mb-10 max-w-xl mx-auto">{strings.footer.cta_subtitle}</p>
           <div className="flex justify-center w-full mb-16">
             <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col md:flex-row gap-4">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={strings.email_placeholder} className="flex-1 bg-slate-800 text-white placeholder-slate-500 px-6 py-4 rounded-l-lg border border-r-0 border-slate-700 focus:outline-none focus:border-emerald-500/50 transition-all text-center md:text-left" required />
                <button type="submit" disabled={status === 'loading' || status === 'success'} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-lg transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap">
                  {status === 'loading' ? '...' : status === 'success' ? strings.status.success : strings.join_btn}
                </button>
             </form>
           </div>
           <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-600 text-sm gap-4">
              <div className="flex items-center gap-2"><Globe size={16} /><span>© 2025 {strings.footer.copyright}</span></div>
              <div className="flex gap-6"><a href="#" className="hover:text-emerald-400 transition">{strings.footer.privacy}</a><a href="#" className="hover:text-emerald-400 transition">{strings.footer.contact}</a></div>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
