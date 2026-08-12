// ===== INTERNATIONALIZATION (i18n) SYSTEM =====
// Load order: FIRST (before cars.js)

var LANGUAGES = {
    tr: { flag: "\u{1F1F9}\u{1F1F7}", name: "T\u00fcrk\u00e7e" },
    en: { flag: "\u{1F1EC}\u{1F1E7}", name: "English" },
    es: { flag: "\u{1F1EA}\u{1F1F8}", name: "Espa\u00f1ol" },
    pt: { flag: "\u{1F1E7}\u{1F1F7}", name: "Portugu\u00eas" },
    fr: { flag: "\u{1F1EB}\u{1F1F7}", name: "Fran\u00e7ais" },
    de: { flag: "\u{1F1E9}\u{1F1EA}", name: "Deutsch" },
    it: { flag: "\u{1F1EE}\u{1F1F9}", name: "Italiano" },
    ru: { flag: "\u{1F1F7}\u{1F1FA}", name: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
    ja: { flag: "\u{1F1EF}\u{1F1F5}", name: "\u65e5\u672c\u8a9e" },
    ko: { flag: "\u{1F1F0}\u{1F1F7}", name: "\ud55c\uad6d\uc5b4" },
    zh: { flag: "\u{1F1E8}\u{1F1F3}", name: "\u4e2d\u6587" },
    ar: { flag: "\u{1F1F8}\u{1F1E6}", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
    hi: { flag: "\u{1F1EE}\u{1F1F3}", name: "\u0939\u093f\u0928\u094d\u0926\u0940" },
    nl: { flag: "\u{1F1F3}\u{1F1F1}", name: "Nederlands" },
    pl: { flag: "\u{1F1F5}\u{1F1F1}", name: "Polski" }
};

var TRANSLATIONS = {
    // --- UI ---
    start_game: {
        tr: "OYUNA BA\u015eLA", en: "START GAME", es: "INICIAR JUEGO", pt: "INICIAR JOGO",
        fr: "JOUER", de: "SPIEL STARTEN", it: "INIZIA", ru: "\u041d\u0410\u0427\u0410\u0422\u042c",
        ja: "\u30b2\u30fc\u30e0\u958b\u59cb", ko: "\uac8c\uc784 \uc2dc\uc791", zh: "\u5f00\u59cb\u6e38\u620f", ar: "\u0627\u0628\u062f\u0623 \u0627\u0644\u0644\u0639\u0628\u0629",
        hi: "\u0916\u0947\u0932 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902", nl: "START SPEL", pl: "ROZPOCZNIJ GR\u0118"
    },
    best: {
        tr: "EN \u0130Y\u0130", en: "BEST", es: "MEJOR", pt: "MELHOR",
        fr: "MEILLEUR", de: "BESTE", it: "MIGLIORE", ru: "\u041b\u0423\u0427\u0428\u0415\u0415",
        ja: "\u30d9\u30b9\u30c8", ko: "\ucd5c\uace0", zh: "\u6700\u4f73", ar: "\u0623\u0641\u0636\u0644",
        hi: "\u0936\u094d\u0930\u0947\u0937\u094d\u0920", nl: "BESTE", pl: "NAJLEPSZY"
    },
    buy: {
        tr: "SATIN AL", en: "BUY", es: "COMPRAR", pt: "COMPRAR",
        fr: "ACHETER", de: "KAUFEN", it: "COMPRA", ru: "\u041a\u0423\u041f\u0418\u0422\u042c",
        ja: "\u8cfc\u5165", ko: "\uad6c\ub9e4", zh: "\u8d2d\u4e70", ar: "\u0634\u0631\u0627\u0621",
        hi: "\u0916\u0930\u0940\u0926\u0947\u0902", nl: "KOPEN", pl: "KUP"
    },
    confirm: {
        tr: "ONAYLA?", en: "CONFIRM?", es: "\u00bfCONFIRMAR?", pt: "CONFIRMAR?",
        fr: "CONFIRMER?", de: "BEST\u00c4TIGEN?", it: "CONFERMA?", ru: "\u041f\u041e\u0414\u0422\u0412\u0415\u0420\u0414\u0418\u0422\u042c?",
        ja: "\u78ba\u8a8d\uff1f", ko: "\ud655\uc778?", zh: "\u786e\u8ba4\uff1f", ar: "\u062a\u0623\u0643\u064a\u062f\u061f",
        hi: "\u092a\u0941\u0937\u094d\u091f\u093f \u0915\u0930\u0947\u0902?", nl: "BEVESTIGEN?", pl: "POTWIERDZI\u0106?"
    },
    not_enough: {
        tr: "YETERL\u0130 DE\u011e\u0130L", en: "NOT ENOUGH", es: "INSUFICIENTE", pt: "INSUFICIENTE",
        fr: "PAS ASSEZ", de: "NICHT GENUG", it: "NON BASTA", ru: "\u041d\u0415\u0414\u041e\u0421\u0422\u0410\u0422\u041e\u0427\u041d\u041e",
        ja: "\u4e0d\u8db3", ko: "\ubd80\uc871", zh: "\u4e0d\u8db3", ar: "\u063a\u064a\u0631 \u0643\u0627\u0641\u064a",
        hi: "\u092a\u0930\u094d\u092f\u093e\u092a\u094d\u0924 \u0928\u0939\u0940\u0902", nl: "NIET GENOEG", pl: "ZA MA\u0141O"
    },
    select: {
        tr: "SE\u00c7", en: "SELECT", es: "ELEGIR", pt: "SELECIONAR",
        fr: "CHOISIR", de: "W\u00c4HLEN", it: "SCEGLI", ru: "\u0412\u042b\u0411\u0420\u0410\u0422\u042c",
        ja: "\u9078\u629e", ko: "\uc120\ud0dd", zh: "\u9009\u62e9", ar: "\u0627\u062e\u062a\u064a\u0627\u0631",
        hi: "\u091a\u0941\u0928\u0947\u0902", nl: "KIEZEN", pl: "WYBIERZ"
    },
    selected: {
        tr: "SE\u00c7\u0130L\u0130", en: "SELECTED", es: "ELEGIDO", pt: "SELECIONADO",
        fr: "CHOISI", de: "AUSGEW\u00c4HLT", it: "SCELTO", ru: "\u0412\u042b\u0411\u0420\u0410\u041d\u041e",
        ja: "\u9078\u629e\u6e08\u307f", ko: "\uc120\ud0dd\ub428", zh: "\u5df2\u9009\u62e9", ar: "\u0645\u062e\u062a\u0627\u0631",
        hi: "\u091a\u0941\u0928\u093e \u0939\u0941\u0906", nl: "GEKOZEN", pl: "WYBRANO"
    },

    // --- Pause ---
    paused: {
        tr: "DURAKLADI", en: "PAUSED", es: "PAUSADO", pt: "PAUSADO",
        fr: "PAUSE", de: "PAUSIERT", it: "PAUSA", ru: "\u041f\u0410\u0423\u0417\u0410",
        ja: "\u4e00\u6642\u505c\u6b62", ko: "\uc77c\uc2dc\uc815\uc9c0", zh: "\u5df2\u6682\u505c", ar: "\u0645\u0624\u0642\u062a",
        hi: "\u0930\u0941\u0915\u093e \u0939\u0941\u0906", nl: "GEPAUZEERD", pl: "PAUZA"
    },
    resume: {
        tr: "DEVAM", en: "RESUME", es: "CONTINUAR", pt: "CONTINUAR",
        fr: "REPRENDRE", de: "FORTSETZEN", it: "RIPRENDI", ru: "\u041f\u0420\u041e\u0414\u041e\u041b\u0416\u0418\u0422\u042c",
        ja: "\u518d\u958b", ko: "\uacc4\uc18d", zh: "\u7ee7\u7eed", ar: "\u0627\u0633\u062a\u0645\u0631\u0627\u0631",
        hi: "\u091c\u093e\u0930\u0940 \u0930\u0916\u0947\u0902", nl: "HERVATTEN", pl: "WZNO\u0141"
    },
    restart: {
        tr: "YENIDEN", en: "RESTART", es: "REINICIAR", pt: "REINICIAR",
        fr: "RECOMMENCER", de: "NEUSTART", it: "RICOMINCIA", ru: "\u0417\u0410\u041d\u041e\u0412\u041e",
        ja: "\u30ea\u30b9\u30bf\u30fc\u30c8", ko: "\uc7ac\uc2dc\uc791", zh: "\u91cd\u65b0\u5f00\u59cb", ar: "\u0625\u0639\u0627\u062f\u0629",
        hi: "\u092a\u0941\u0928\u0903 \u0906\u0930\u0902\u092d", nl: "HERSTARTEN", pl: "RESTART"
    },

    // --- Game Over ---
    game: {
        tr: "OYUN", en: "GAME", es: "JUEGO", pt: "JOGO",
        fr: "JEU", de: "SPIEL", it: "GIOCO", ru: "\u0418\u0413\u0420\u0410",
        ja: "\u30b2\u30fc\u30e0", ko: "\uac8c\uc784", zh: "\u6e38\u620f", ar: "\u0627\u0644\u0644\u0639\u0628\u0629",
        hi: "\u0916\u0947\u0932", nl: "SPEL", pl: "GRA"
    },
    over: {
        tr: "B\u0130TT\u0130", en: "OVER", es: "TERMINADO", pt: "ACABOU",
        fr: "TERMIN\u00c9", de: "VORBEI", it: "FINITO", ru: "\u041e\u041a\u041e\u041d\u0427\u0415\u041d\u0410",
        ja: "\u30aa\u30fc\u30d0\u30fc", ko: "\uc624\ubc84", zh: "\u7ed3\u675f", ar: "\u0627\u0646\u062a\u0647\u0649",
        hi: "\u0916\u0924\u094d\u092e", nl: "VOORBIJ", pl: "KONIEC"
    },
    score: {
        tr: "SKOR", en: "SCORE", es: "PUNTOS", pt: "PONTOS",
        fr: "SCORE", de: "PUNKTE", it: "PUNTI", ru: "\u0421\u0427\u0401\u0422",
        ja: "\u30b9\u30b3\u30a2", ko: "\uc810\uc218", zh: "\u5206\u6570", ar: "\u0627\u0644\u0646\u0642\u0627\u0637",
        hi: "\u0938\u094d\u0915\u094b\u0930", nl: "SCORE", pl: "WYNIK"
    },
    new_best: {
        tr: "YEN\u0130 REKOR!", en: "NEW BEST!", es: "\u00a1NUEVO R\u00c9CORD!", pt: "NOVO RECORDE!",
        fr: "NOUVEAU RECORD!", de: "NEUER REKORD!", it: "NUOVO RECORD!", ru: "\u041d\u041e\u0412\u042b\u0419 \u0420\u0415\u041a\u041e\u0420\u0414!",
        ja: "\u65b0\u8a18\u9332\uff01", ko: "\uc2e0\uae30\ub85d!", zh: "\u65b0\u7eaa\u5f55\uff01", ar: "\u0631\u0642\u0645 \u0642\u064a\u0627\u0633\u064a \u062c\u062f\u064a\u062f!",
        hi: "\u0928\u092f\u093e \u0930\u093f\u0915\u0949\u0930\u094d\u0921!", nl: "NIEUW RECORD!", pl: "NOWY REKORD!"
    },
    replay: {
        tr: "TEKRAR", en: "REPLAY", es: "REPETIR", pt: "REPETIR",
        fr: "REJOUER", de: "NOCHMAL", it: "RIGIOCA", ru: "\u0417\u0410\u041d\u041e\u0412\u041e",
        ja: "\u30ea\u30d7\u30ec\u30a4", ko: "\ub2e4\uc2dc\ud558\uae30", zh: "\u91cd\u73a9", ar: "\u0625\u0639\u0627\u062f\u0629",
        hi: "\u0926\u094b\u092c\u093e\u0930\u093e", nl: "OPNIEUW", pl: "POWT\u00d3RZ"
    },
    lobby: {
        tr: "LOB\u0130", en: "LOBBY", es: "VEST\u00cdBULO", pt: "LOBBY",
        fr: "LOBBY", de: "LOBBY", it: "LOBBY", ru: "\u041b\u041e\u0411\u0411\u0418",
        ja: "\u30ed\u30d3\u30fc", ko: "\ub85c\ube44", zh: "\u5927\u5385", ar: "\u0627\u0644\u0631\u062f\u0647\u0629",
        hi: "\u0932\u0949\u092c\u0940", nl: "LOBBY", pl: "LOBBY"
    },

    // --- Level ---
    levels: {
        tr: "B\u00d6L\u00dcMLER", en: "LEVELS", es: "NIVELES", pt: "N\u00cdVEIS",
        fr: "NIVEAUX", de: "LEVEL", it: "LIVELLI", ru: "\u0423\u0420\u041e\u0412\u041d\u0418",
        ja: "\u30ec\u30d9\u30eb", ko: "\ub808\ubca8", zh: "\u5173\u5361", ar: "\u0627\u0644\u0645\u0633\u062a\u0648\u064a\u0627\u062a",
        hi: "\u0938\u094d\u0924\u0930", nl: "LEVELS", pl: "POZIOMY"
    },
    level_complete: {
        tr: "B\u00d6L\u00dcM TAMAMLANDI!", en: "LEVEL COMPLETE!", es: "\u00a1NIVEL COMPLETADO!", pt: "N\u00cdVEL COMPLETO!",
        fr: "NIVEAU TERMIN\u00c9!", de: "LEVEL GESCHAFFT!", it: "LIVELLO COMPLETATO!", ru: "\u0423\u0420\u041e\u0412\u0415\u041d\u042c \u041f\u0420\u041e\u0419\u0414\u0415\u041d!",
        ja: "\u30ec\u30d9\u30eb\u30af\u30ea\u30a2\uff01", ko: "\ub808\ubca8 \ud074\ub9ac\uc5b4!", zh: "\u5173\u5361\u5b8c\u6210\uff01", ar: "\u0627\u0643\u062a\u0645\u0644 \u0627\u0644\u0645\u0633\u062a\u0648\u0649!",
        hi: "\u0938\u094d\u0924\u0930 \u092a\u0942\u0930\u093e!", nl: "LEVEL VOLTOOID!", pl: "POZIOM UKO\u0143CZONY!"
    },
    next_level: {
        tr: "SIRADAK\u0130 B\u00d6L\u00dcM", en: "NEXT LEVEL", es: "SIGUIENTE NIVEL", pt: "PR\u00d3XIMO N\u00cdVEL",
        fr: "NIVEAU SUIVANT", de: "N\u00c4CHSTES LEVEL", it: "PROSSIMO LIVELLO", ru: "\u0421\u041b\u0415\u0414\u0423\u042e\u0429\u0418\u0419",
        ja: "\u6b21\u306e\u30ec\u30d9\u30eb", ko: "\ub2e4\uc74c \ub808\ubca8", zh: "\u4e0b\u4e00\u5173", ar: "\u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0627\u0644\u064a",
        hi: "\u0905\u0917\u0932\u093e \u0938\u094d\u0924\u0930", nl: "VOLGEND LEVEL", pl: "NAST\u0118PNY POZIOM"
    },
    level_x: {
        tr: "B\u00f6l\u00fcm", en: "Level", es: "Nivel", pt: "N\u00edvel",
        fr: "Niveau", de: "Level", it: "Livello", ru: "\u0423\u0440\u043e\u0432\u0435\u043d\u044c",
        ja: "\u30ec\u30d9\u30eb", ko: "\ub808\ubca8", zh: "\u5173\u5361", ar: "\u0627\u0644\u0645\u0633\u062a\u0648\u0649",
        hi: "\u0938\u094d\u0924\u0930", nl: "Level", pl: "Poziom"
    },

    // --- Game 3D ---
    finish: {
        tr: "F\u0130N\u0130\u015e", en: "FINISH", es: "META", pt: "CHEGADA",
        fr: "ARRIV\u00c9E", de: "ZIEL", it: "TRAGUARDO", ru: "\u0424\u0418\u041d\u0418\u0428",
        ja: "\u30b4\u30fc\u30eb", ko: "\uacb0\uc2b9", zh: "\u7ec8\u70b9", ar: "\u0627\u0644\u0646\u0647\u0627\u064a\u0629",
        hi: "\u092b\u093f\u0928\u093f\u0936", nl: "FINISH", pl: "META"
    },
    start_text: {
        tr: "BA\u015eLA", en: "START", es: "INICIO", pt: "IN\u00cdCIO",
        fr: "D\u00c9PART", de: "START", it: "PARTENZA", ru: "\u0421\u0422\u0410\u0420\u0422",
        ja: "\u30b9\u30bf\u30fc\u30c8", ko: "\uc2dc\uc791", zh: "\u8d77\u70b9", ar: "\u0627\u0644\u0628\u062f\u0627\u064a\u0629",
        hi: "\u0936\u0941\u0930\u0942", nl: "START", pl: "START"
    },

    // --- Settings ---
    settings: {
        tr: "AYARLAR", en: "SETTINGS", es: "AJUSTES", pt: "CONFIGURA\u00c7\u00d5ES",
        fr: "PARAM\u00c8TRES", de: "EINSTELLUNGEN", it: "IMPOSTAZIONI", ru: "\u041d\u0410\u0421\u0422\u0420\u041e\u0419\u041a\u0418",
        ja: "\u8a2d\u5b9a", ko: "\uc124\uc815", zh: "\u8bbe\u7f6e", ar: "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",
        hi: "\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938", nl: "INSTELLINGEN", pl: "USTAWIENIA"
    },
    sound: {
        tr: "SES", en: "SOUND", es: "SONIDO", pt: "SOM",
        fr: "SON", de: "TON", it: "SUONO", ru: "\u0417\u0412\u0423\u041a",
        ja: "\u30b5\u30a6\u30f3\u30c9", ko: "\uc0ac\uc6b4\ub4dc", zh: "\u58f0\u97f3", ar: "\u0627\u0644\u0635\u0648\u062a",
        hi: "\u0927\u094d\u0935\u0928\u093f", nl: "GELUID", pl: "D\u0179WI\u0118K"
    },
    music: {
        tr: "M\u00fczik", en: "Music", es: "M\u00fasica", pt: "M\u00fasica",
        fr: "Musique", de: "Musik", it: "Musica", ru: "\u041c\u0443\u0437\u044b\u043a\u0430",
        ja: "\u97f3\u697d", ko: "\uc74c\uc545", zh: "\u97f3\u4e50", ar: "\u0645\u0648\u0633\u064a\u0642\u0649",
        hi: "\u0938\u0902\u0917\u0940\u0924", nl: "Muziek", pl: "Muzyka"
    },
    sfx: {
        tr: "Efektler", en: "SFX", es: "Efectos", pt: "Efeitos",
        fr: "Effets", de: "Effekte", it: "Effetti", ru: "\u042d\u0444\u0444\u0435\u043a\u0442\u044b",
        ja: "\u52b9\u679c\u97f3", ko: "\ud6a8\uacfc\uc74c", zh: "\u97f3\u6548", ar: "\u0645\u0624\u062b\u0631\u0627\u062a",
        hi: "\u0907\u092b\u0947\u0915\u094d\u091f\u094d\u0938", nl: "Effecten", pl: "Efekty"
    },
    language: {
        tr: "D\u0130L", en: "LANGUAGE", es: "IDIOMA", pt: "IDIOMA",
        fr: "LANGUE", de: "SPRACHE", it: "LINGUA", ru: "\u042f\u0417\u042b\u041a",
        ja: "\u8a00\u8a9e", ko: "\uc5b8\uc5b4", zh: "\u8bed\u8a00", ar: "\u0627\u0644\u0644\u063a\u0629",
        hi: "\u092d\u093e\u0937\u093e", nl: "TAAL", pl: "J\u0118ZYK"
    },
    reset_storage: {
        tr: "T\u00dcM VER\u0130LER\u0130 S\u0130L", en: "RESET ALL DATA", es: "BORRAR TODOS LOS DATOS", pt: "REDEFINIR TODOS OS DADOS",
        fr: "R\u00c9INITIALISER", de: "ALLE DATEN L\u00d6SCHEN", it: "CANCELLA TUTTO", ru: "\u0421\u0411\u0420\u041e\u0421\u0418\u0422\u042c \u0412\u0421\u0401",
        ja: "\u5168\u30c7\u30fc\u30bf\u524a\u9664", ko: "\ub370\uc774\ud130 \ucd08\uae30\ud654", zh: "\u91cd\u7f6e\u6240\u6709\u6570\u636e", ar: "\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u0643\u0644",
        hi: "\u0938\u092c \u0921\u0947\u091f\u093e \u0930\u0940\u0938\u0947\u091f \u0915\u0930\u0947\u0902", nl: "ALLES WISSEN", pl: "RESETUJ DANE"
    },
    reset_confirm: {
        tr: "EM\u0130N M\u0130S\u0130N\u0130Z?", en: "ARE YOU SURE?", es: "\u00bfEST\u00c1S SEGURO?", pt: "TEM CERTEZA?",
        fr: "\u00caTES-VOUS S\u00dbR?", de: "BIST DU SICHER?", it: "SEI SICURO?", ru: "\u0412\u042b \u0423\u0412\u0415\u0420\u0415\u041d\u042b?",
        ja: "\u672c\u5f53\u306b\uff1f", ko: "\ud655\uc2e4\ud569\ub2c8\uae4c?", zh: "\u786e\u5b9a\u5417\uff1f", ar: "\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f\u061f",
        hi: "\u0915\u094d\u092f\u093e \u0906\u092a \u0938\u0941\u0928\u093f\u0936\u094d\u091a\u093f\u0924 \u0939\u0948\u0902?", nl: "WEET JE HET ZEKER?", pl: "CZY NA PEWNO?"
    },
    cancel: {
        tr: "\u0130PTAL", en: "CANCEL", es: "CANCELAR", pt: "CANCELAR",
        fr: "ANNULER", de: "ABBRECHEN", it: "ANNULLA", ru: "\u041e\u0422\u041c\u0415\u041d\u0410",
        ja: "\u30ad\u30e3\u30f3\u30bb\u30eb", ko: "\ucde8\uc18c", zh: "\u53d6\u6d88", ar: "\u0625\u0644\u063a\u0627\u0621",
        hi: "\u0930\u0926\u094d\u0926 \u0915\u0930\u0947\u0902", nl: "ANNULEREN", pl: "ANULUJ"
    },

    // --- All Complete ---
    all_complete_title: {
        tr: "TÜM BÖLÜMLER TAMAMLANDI!", en: "ALL LEVELS COMPLETE!", es: "¡TODOS LOS NIVELES COMPLETADOS!", pt: "TODOS OS NÍVEIS COMPLETOS!",
        fr: "TOUS LES NIVEAUX TERMINÉS!", de: "ALLE LEVEL GESCHAFFT!", it: "TUTTI I LIVELLI COMPLETATI!", ru: "ВСЕ УРОВНИ ПРОЙДЕНЫ!",
        ja: "全レベルクリア！", ko: "모든 레벨 완료!", zh: "所有关卡已完成！", ar: "اكتملت جميع المستويات!",
        hi: "सभी स्तर पूरे!", nl: "ALLE LEVELS VOLTOOID!", pl: "WSZYSTKIE POZIOMY UKOŃCZONE!"
    },
    all_complete_msg: {
        tr: "Her zorluğu yendin!", en: "You conquered every challenge!", es: "¡Conquistaste cada desafío!", pt: "Você conquistou todos os desafios!",
        fr: "Vous avez relevé tous les défis!", de: "Du hast jede Herausforderung gemeistert!", it: "Hai superato ogni sfida!", ru: "Вы покорили все испытания!",
        ja: "すべての挑戦を制覇した！", ko: "모든 도전을 정복했습니다!", zh: "你征服了所有挑战！", ar: "لقد تغلبت على كل التحديات!",
        hi: "आपने हर चुनौती जीत ली!", nl: "Je hebt elke uitdaging overwonnen!", pl: "Pokonałeś każde wyzwanie!"
    },
    total_stars: {
        tr: "Toplam Yıldız", en: "Total Stars", es: "Estrellas Totales", pt: "Estrelas Totais",
        fr: "Étoiles Totales", de: "Sterne Gesamt", it: "Stelle Totali", ru: "Всего Звёзд",
        ja: "合計スター", ko: "총 별", zh: "总星数", ar: "إجمالي النجوم",
        hi: "कुल सितारे", nl: "Totaal Sterren", pl: "Łączne Gwiazdki"
    },
    back_to_lobby: {
        tr: "Lobiye Dön", en: "Back to Lobby", es: "Volver al Vestíbulo", pt: "Voltar ao Lobby",
        fr: "Retour au Lobby", de: "Zurück zur Lobby", it: "Torna alla Lobby", ru: "В Лобби",
        ja: "ロビーに戻る", ko: "로비로 돌아가기", zh: "返回大厅", ar: "العودة للردهة",
        hi: "लॉबी पर वापस", nl: "Terug naar Lobby", pl: "Wróć do Lobby"
    },
    view_levels: {
        tr: "Bölümleri Gör", en: "View Levels", es: "Ver Niveles", pt: "Ver Níveis",
        fr: "Voir les Niveaux", de: "Level Ansehen", it: "Vedi Livelli", ru: "Смотреть Уровни",
        ja: "レベル一覧", ko: "레벨 보기", zh: "查看关卡", ar: "عرض المستويات",
        hi: "स्तर देखें", nl: "Levels Bekijken", pl: "Zobacz Poziomy"
    },

    // --- Loading ---
    drift_boss: {
        tr: "DRIFT BOSS", en: "DRIFT BOSS", es: "DRIFT BOSS", pt: "DRIFT BOSS",
        fr: "DRIFT BOSS", de: "DRIFT BOSS", it: "DRIFT BOSS", ru: "DRIFT BOSS",
        ja: "DRIFT BOSS", ko: "DRIFT BOSS", zh: "DRIFT BOSS", ar: "DRIFT BOSS",
        hi: "DRIFT BOSS", nl: "DRIFT BOSS", pl: "DRIFT BOSS"
    },
    loading: {
        tr: "Y\u00fckleniyor...", en: "Loading...", es: "Cargando...", pt: "Carregando...",
        fr: "Chargement...", de: "Laden...", it: "Caricamento...", ru: "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...",
        ja: "\u8aad\u307f\u8fbc\u307f\u4e2d...", ko: "\ub85c\ub529 \uc911...", zh: "\u52a0\u8f7d\u4e2d...", ar: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...",
        hi: "\u0932\u094b\u0921 \u0939\u094b \u0930\u0939\u093e \u0939\u0948...", nl: "Laden...", pl: "\u0141adowanie..."
    },
    tap_to_start: {
        tr: "BA\u015eLAMAK \u0130\u00c7\u0130N DOKUN", en: "TAP TO START", es: "TOCA PARA EMPEZAR", pt: "TOQUE PARA INICIAR",
        fr: "APPUYEZ POUR COMMENCER", de: "TIPPE ZUM STARTEN", it: "TOCCA PER INIZIARE", ru: "\u041d\u0410\u0416\u041c\u0418\u0422\u0415",
        ja: "\u30bf\u30c3\u30d7\u3057\u3066\u30b9\u30bf\u30fc\u30c8", ko: "\ud130\uce58\ud558\uc5ec \uc2dc\uc791", zh: "\u70b9\u51fb\u5f00\u59cb", ar: "\u0627\u0636\u063a\u0637 \u0644\u0644\u0628\u062f\u0621",
        hi: "\u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u091f\u0948\u092a \u0915\u0930\u0947\u0902", nl: "TIK OM TE STARTEN", pl: "DOTKIJ, ABY ZACZ\u0104\u0106"
    },

    // --- Hint ---
    hint: {
        tr: "Sa\u011fa d\u00f6nmek i\u00e7in basili tutun, sola d\u00f6nmek i\u00e7in birak\u0131n",
        en: "Hold to turn right, release to turn left",
        es: "Mant\u00e9n para girar a la derecha, suelta para girar a la izquierda",
        pt: "Segure para virar \u00e0 direita, solte para virar \u00e0 esquerda",
        fr: "Maintenez pour tourner \u00e0 droite, rel\u00e2chez pour tourner \u00e0 gauche",
        de: "Halten f\u00fcr rechts, loslassen f\u00fcr links",
        it: "Tieni premuto per girare a destra, rilascia per girare a sinistra",
        ru: "\u0423\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439\u0442\u0435 \u0434\u043b\u044f \u043f\u043e\u0432\u043e\u0440\u043e\u0442\u0430 \u043d\u0430\u043f\u0440\u0430\u0432\u043e, \u043e\u0442\u043f\u0443\u0441\u0442\u0438\u0442\u0435 \u0434\u043b\u044f \u043b\u0435\u0432\u043e\u0433\u043e",
        ja: "\u9577\u62bc\u3057\u3067\u53f3\u6298\u308c\u3001\u96e2\u3059\u3068\u5de6\u6298\u308c",
        ko: "\uae38\uac8c \ub204\ub974\uba74 \uc6b0\ud68c\uc804, \ub193\uc73c\uba74 \uc88c\ud68c\uc804",
        zh: "\u6309\u4f4f\u53f3\u8f6c\uff0c\u677e\u5f00\u5de6\u8f6c",
        ar: "\u0627\u0636\u063a\u0637 \u0644\u0644\u0627\u0646\u0639\u0637\u0627\u0641 \u064a\u0645\u064a\u0646\u0627\u064b\u060c \u0627\u062a\u0631\u0643 \u0644\u0644\u0627\u0646\u0639\u0637\u0627\u0641 \u064a\u0633\u0627\u0631\u0627\u064b",
        hi: "\u0926\u093e\u090f\u0902 \u092e\u094b\u0921\u093c\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0926\u092c\u093e\u090f\u0902, \u092c\u093e\u090f\u0902 \u092e\u094b\u0921\u093c\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u091b\u094b\u0921\u093c\u0947\u0902",
        nl: "Houd ingedrukt om rechts te draaien, laat los om links te draaien",
        pl: "Przytrzymaj, aby skr\u0119ci\u0107 w prawo, pu\u015b\u0107, aby skr\u0119ci\u0107 w lewo"
    },

    // --- Car names ---
    // car1.glb: Red muscle car with white racing stripes
    car_classic_name: {
        tr: "Alev", en: "Blaze", es: "Llama", pt: "Chama",
        fr: "Flamme", de: "Flamme", it: "Fiamma", ru: "\u041f\u043b\u0430\u043c\u044f",
        ja: "\u30d6\u30ec\u30a4\u30ba", ko: "\ube14\ub808\uc774\uc988", zh: "\u70c8\u7130", ar: "\u0644\u0647\u064a\u0628",
        hi: "\u092c\u094d\u0932\u0947\u095b", nl: "Vlam", pl: "P\u0142omie\u0144"
    },
    car_classic_desc: {
        tr: "Efsane sokak yar\u0131\u015f\u00e7\u0131s\u0131", en: "A true street legend", es: "Una leyenda callejera", pt: "Lenda das ruas",
        fr: "L\u00e9gende de la rue", de: "Eine echte Stra\u00dfenlegende", it: "Leggenda della strada", ru: "\u041b\u0435\u0433\u0435\u043d\u0434\u0430 \u0443\u043b\u0438\u0446",
        ja: "\u30b9\u30c8\u30ea\u30fc\u30c8\u306e\u4f1d\u8aac", ko: "\uc9c4\uc815\ud55c \uc2a4\ud2b8\ub9bf \ub808\uc804\ub4dc", zh: "\u771f\u6b63\u7684\u8857\u5934\u4f20\u5947", ar: "\u0623\u0633\u0637\u0648\u0631\u0629 \u0627\u0644\u0634\u0648\u0627\u0631\u0639",
        hi: "\u0938\u0921\u093c\u0915 \u0915\u093e \u0905\u0938\u0932\u0940 \u0932\u0947\u091c\u0947\u0902\u0921", nl: "Een echte straatlegende", pl: "Prawdziwa uliczna legenda"
    },
    // car2.glb: Blue/white compact rally car with orange accents and spoiler
    car_crimson_name: {
        tr: "Y\u0131ld\u0131r\u0131m", en: "Bolt", es: "Rayo", pt: "Raio",
        fr: "\u00c9clair", de: "Blitz", it: "Fulmine", ru: "\u041c\u043e\u043b\u043d\u0438\u044f",
        ja: "\u30dc\u30eb\u30c8", ko: "\ubc88\uac1c", zh: "\u95ea\u7535", ar: "\u0628\u0631\u0642",
        hi: "\u092c\u094b\u0932\u094d\u091f", nl: "Bliksem", pl: "B\u0142yskawica"
    },
    car_crimson_desc: {
        tr: "\u015eim\u015fek kadar h\u0131zl\u0131", en: "Quick as lightning", es: "R\u00e1pido como un rayo", pt: "R\u00e1pido como um raio",
        fr: "Rapide comme l'\u00e9clair", de: "Schnell wie der Blitz", it: "Veloce come un fulmine", ru: "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u043a\u0430\u043a \u043c\u043e\u043b\u043d\u0438\u044f",
        ja: "\u7a32\u59bb\u306e\u3088\u3046\u306b\u901f\u3044", ko: "\ubc88\uac1c\ucc98\ub7fc \ube60\ub978", zh: "\u5feb\u5982\u95ea\u7535", ar: "\u0633\u0631\u064a\u0639 \u0643\u0627\u0644\u0628\u0631\u0642",
        hi: "\u092c\u093f\u091c\u0932\u0940 \u0915\u0940 \u0924\u0930\u0939 \u0924\u0947\u095b", nl: "Snel als de bliksem", pl: "Szybki jak b\u0142yskawica"
    },
    // car3.glb: Aggressive angular racer with big rear wing, orange/blue
    car_ocean_name: {
        tr: "Jilet", en: "Razor", es: "Filo", pt: "L\u00e2mina",
        fr: "Rasoir", de: "Klinge", it: "Lama", ru: "\u041b\u0435\u0437\u0432\u0438\u0435",
        ja: "\u30ec\u30a4\u30b6\u30fc", ko: "\ub808\uc774\uc800", zh: "\u5251\u950b", ar: "\u0634\u0641\u0631\u0629",
        hi: "\u0930\u0947\u095b\u0930", nl: "Scheermes", pl: "Brzytwa"
    },
    car_ocean_desc: {
        tr: "R\u00fczgar\u0131 keser ge\u00e7er", en: "Cuts through the wind", es: "Corta el viento", pt: "Corta o vento",
        fr: "Fend le vent", de: "Schneidet durch den Wind", it: "Taglia il vento", ru: "\u0420\u0435\u0436\u0435\u0442 \u0432\u0435\u0442\u0435\u0440",
        ja: "\u98a8\u3092\u5207\u308a\u88c2\u304f", ko: "\ubc14\ub78c\uc744 \uac00\ub974\ub294", zh: "\u5207\u5272\u98ce\u4e2d", ar: "\u064a\u0634\u0642 \u0627\u0644\u0631\u064a\u0627\u062d",
        hi: "\u0939\u0935\u093e \u0915\u094b \u091a\u0940\u0930\u0924\u0940 \u0939\u0948", nl: "Snijdt door de wind", pl: "Przecina wiatr"
    },
    // car4.glb: Wild racer with green wing/fin decorations, blue body
    car_sunset_name: {
        tr: "Anka", en: "Phoenix", es: "F\u00e9nix", pt: "F\u00eanix",
        fr: "Ph\u00e9nix", de: "Ph\u00f6nix", it: "Fenice", ru: "\u0424\u0435\u043d\u0438\u043a\u0441",
        ja: "\u30d5\u30a7\u30cb\u30c3\u30af\u30b9", ko: "\ud53c\ub2c9\uc2a4", zh: "\u51e4\u51f0", ar: "\u0637\u0627\u0626\u0631 \u0627\u0644\u0646\u0627\u0631",
        hi: "\u092b\u0940\u0928\u093f\u0915\u094d\u0938", nl: "Feniks", pl: "Feniks"
    },
    car_sunset_desc: {
        tr: "\u00d6fkeyle y\u00fckselir", en: "Rise with fury", es: "Se alza con furia", pt: "Ergue-se com f\u00faria",
        fr: "S'\u00e9l\u00e8ve avec fureur", de: "Erhebt sich mit Wut", it: "Sorge con furia", ru: "\u0412\u0437\u043b\u0435\u0442\u0430\u0435\u0442 \u0441 \u044f\u0440\u043e\u0441\u0442\u044c\u044e",
        ja: "\u6012\u308a\u3068\u5171\u306b\u8207\u308b", ko: "\ubd84\ub178\ub85c \uc19c\uc544\uc624\ub974\ub2e4", zh: "\u6012\u706b\u51b2\u5929", ar: "\u064a\u0646\u0647\u0636 \u0628\u063a\u0636\u0628",
        hi: "\u0917\u0941\u0938\u094d\u0938\u0947 \u0938\u0947 \u0909\u0920\u0924\u0940 \u0939\u0948", nl: "Rijst op met woede", pl: "Wznosi si\u0119 z furi\u0105"
    }
};

// --- Current language ---
var currentLang = "en";

function T(key) {
    var entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[currentLang] || entry.en || key;
}

function detectLanguage() {
    var navLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    // Try exact match first (e.g., "pt-br" -> "pt")
    var code = navLang.split("-")[0];
    if (LANGUAGES[code]) return code;
    return "en";
}

function setLanguage(lang) {
    if (!LANGUAGES[lang]) lang = "en";
    currentLang = lang;
    localStorage.setItem("driftBossLang", lang);
    applyTranslations();
}

function loadLanguage() {
    var saved = localStorage.getItem("driftBossLang");
    if (saved && LANGUAGES[saved]) {
        currentLang = saved;
    } else {
        currentLang = detectLanguage();
        localStorage.setItem("driftBossLang", currentLang);
    }
    applyTranslations();
}

function applyTranslations() {
    var els = document.querySelectorAll("[data-i18n]");
    els.forEach(function(el) {
        var key = el.getAttribute("data-i18n");
        var text = T(key);
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            el.placeholder = text;
        } else {
            el.textContent = text;
        }
    });
}

// --- Settings screen ---
var settingsResetState = false;
var settingsResetTimer = null;

function showSettings() {
    var screen = document.getElementById("settingsScreen");
    if (!screen) return;
    screen.classList.remove("hidden");
    screen.style.opacity = "0";
    gsap.to(screen, { opacity: 1, duration: 0.3 });

    // Update active language in list
    updateSettingsLangList();
    updateSettingsToggles();
    resetSettingsResetBtn();

    // Animate in
    gsap.fromTo(".settings-container",
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)", delay: 0.1 }
    );
}

function hideSettings(callback) {
    var screen = document.getElementById("settingsScreen");
    if (!screen) return;
    gsap.to(screen, {
        opacity: 0, duration: 0.25, ease: "power2.in",
        onComplete: function() {
            screen.classList.add("hidden");
            if (callback) callback();
        }
    });
}

function updateSettingsLangList() {
    var items = document.querySelectorAll(".settings-lang-item");
    items.forEach(function(item) {
        var lang = item.getAttribute("data-lang");
        if (lang === currentLang) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

function handleSettingsLangClick(lang) {
    setLanguage(lang);
    updateSettingsLangList();
    // Update dynamic elements that don't have data-i18n
    if (typeof updateCarActionUI === "function") updateCarActionUI();
    if (typeof setupLobbyPreview === "function") {
        var nameEl = document.getElementById("carName");
        var descEl = document.getElementById("carDesc");
        if (nameEl && typeof CARS !== "undefined" && typeof lobbyCarIndex !== "undefined") {
            var car = CARS[lobbyCarIndex];
            nameEl.textContent = car.nameKey ? T(car.nameKey) : car.name;
            descEl.textContent = car.descKey ? T(car.descKey) : car.desc;
        }
    }
}

function handleSettingsReset() {
    var btn = document.getElementById("settingsResetBtn");
    if (!btn) return;

    if (!settingsResetState) {
        settingsResetState = true;
        btn.textContent = T("reset_confirm");
        btn.classList.add("confirming");
        settingsResetTimer = setTimeout(resetSettingsResetBtn, 3000);
        return;
    }

    // Second press — reset
    localStorage.clear();
    location.reload();
}

function resetSettingsResetBtn() {
    settingsResetState = false;
    if (settingsResetTimer) { clearTimeout(settingsResetTimer); settingsResetTimer = null; }
    var btn = document.getElementById("settingsResetBtn");
    if (btn) {
        btn.textContent = T("reset_storage");
        btn.classList.remove("confirming");
    }
}

function updateSettingsToggles() {
    var musicRow = document.getElementById("musicToggle");
    var sfxRow = document.getElementById("sfxToggle");
    if (musicRow) {
        if (musicEnabled) musicRow.classList.add("active");
        else musicRow.classList.remove("active");
    }
    if (sfxRow) {
        if (sfxEnabled) sfxRow.classList.add("active");
        else sfxRow.classList.remove("active");
    }
    // Sync volume slider
    var slider = document.getElementById("musicVolumeSlider");
    var valLabel = document.getElementById("musicVolumeValue");
    if (slider) {
        var pct = Math.round(musicVolume * 100);
        slider.value = pct;
        if (valLabel) valLabel.textContent = pct + "%";
    }
}

// Init settings event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Music toggle
    var musicToggle = document.getElementById("musicToggle");
    if (musicToggle) {
        musicToggle.addEventListener("click", function(e) {
            e.stopPropagation();
            initAudio();
            playButtonClickSound();
            setMusicEnabled(!musicEnabled);
            updateSettingsToggles();
            if (musicEnabled && typeof startLobbyMusic === "function") startLobbyMusic();
        });
    }

    // Music volume slider
    var volSlider = document.getElementById("musicVolumeSlider");
    if (volSlider) {
        volSlider.addEventListener("input", function(e) {
            e.stopPropagation();
            var val = parseInt(this.value) / 100;
            setMusicVolume(val);
            var valLabel = document.getElementById("musicVolumeValue");
            if (valLabel) valLabel.textContent = Math.round(val * 100) + "%";
        });
        volSlider.addEventListener("click", function(e) { e.stopPropagation(); });
    }

    // SFX toggle
    var sfxToggle = document.getElementById("sfxToggle");
    if (sfxToggle) {
        sfxToggle.addEventListener("click", function(e) {
            e.stopPropagation();
            initAudio();
            setSfxEnabled(!sfxEnabled);
            updateSettingsToggles();
            playButtonClickSound();
        });
    }

    // Lang items
    var items = document.querySelectorAll(".settings-lang-item");
    items.forEach(function(item) {
        item.addEventListener("click", function(e) {
            e.stopPropagation();
            playButtonClickSound();
            var lang = item.getAttribute("data-lang");
            handleSettingsLangClick(lang);
        });
    });

    // Reset button
    var resetBtn = document.getElementById("settingsResetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            playButtonClickSound();
            handleSettingsReset();
        });
    }

    // Back button
    var backBtn = document.getElementById("settingsBackBtn");
    if (backBtn) {
        backBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            playButtonClickSound();
            hideSettings();
        });
    }

    // Load language on start
    loadLanguage();
});
