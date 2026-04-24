const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

/* ===========================
   APIS EM PORTUGUÊS
=========================== */

// Curiosidades PT-BR
async function getCuriosidade() {
    const facts = [
        "O Brasil é o maior produtor de café do mundo.",
        "O Rio de Janeiro foi a capital do Brasil até 1960.",
        "O nome 'Brasil' vem de 'pau-brasil', uma árvore nativa.",
        "A车牌 do Brasil é 'BR', como domínio da internet.",
        "O Brasil tem a maior biodiversidade do planeta.",
        "O Cristo Redentor é uma das Novas Sete Maravilhas do Mundo.",
        "A Amazônia floresta tropical mais extensa do mundo.",
        "O Brasil possui 26 estados e 1 distrito federal.",
        "O idioma português é o 6º mais falado no mundo.",
        "O Brasil sediou a Copa do Mundo em 1950 e 2014."
    ]
    const randomFact = facts[Math.floor(Math.random() * facts.length)]
    return `🤯 *Curiosidade*\n\n${randomFact}`
}

// Conselhos PT-BR
async function getConselho() {
    const conselhos = [
        "Não guarde rancor — isso só machuca você.",
        "Faça o bem sem olhar a quem.",
        "Cuide da sua saúde mental, ela é importante.",
        "Aprenda algo novo todo dia.",
        "Não tenha medo de pedir ajuda.",
        "Seja grato pelas pequenas coisas.",
        "Não desperdice tempo com pessoas que não valorizam você.",
        "Planeje o futuro, mas aproveite o presente.",
        "Seja gentil — o mundo precisa de mais gentileza.",
        "Não compare sua vida com a dos outros."
    ]
    const randomAdvice = conselhos[Math.floor(Math.random() * conselhos.length)]
    return `🧠 *Conselho*\n\n${randomAdvice}`
}

/* ===========================
   XAVECO & ZOAÇÃO (BANCO INTERNO)
=========================== */

const xavecos = [
    "Você não é Wi‑Fi, mas senti uma conexão aqui 😏",
    "Seu nome é Google? Porque você tem tudo o que procuro 😌",
    "Eu não sou foguete, mas te levo longe 😎",
    "Se beleza fosse crime, você já estava preso(a) 🚓",
    "Não sou corretor, mas invisto tudo em você 😉"
]

const zoacoes = [
    "Atenção 🚨 nível de preguiça detectado no grupo",
    "Essa mensagem foi patrocinada pela falta do que fazer 😌",
    "Alguém chamou o bot ou é carência mesmo?",
    "Esse grupo tá mais parado que fila de cartório 🐌",
    "O silêncio desse grupo é ensurdecedor 😶"
]

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

/* ===========================
   BOT
=========================== */

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth")

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        printQRInTerminal: true
        
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
        if (qr) console.log("📱 Escaneie o QR Code do bot")

        if (connection === "open") {
            console.log("✅ Bot online com sucesso!")
        }

        if (connection === "close") {
            const motivo = lastDisconnect?.error?.output?.statusCode
            if (motivo !== DisconnectReason.loggedOut) startBot()
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const jid = msg.key.remoteJid
        if (!jid.endsWith("@g.us")) return

        const texto =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

        if (!texto || !texto.startsWith("!")) return

        /* ===== COMANDOS ===== */

        if (texto === "!oi") {
            await sock.sendMessage(jid, { text: "🤖 Oi! Estou online 😄" })
        }

        if (texto === "!menu") {
            await sock.sendMessage(jid, {
                text:
                    `📜 *Menu do Bot*

!oi
!menu
!dado
!curiosidade
!conselho
!xaveco
!zoar
!todos mensagem`
            })
        }

        if (texto === "!dado") {
            const n = Math.floor(Math.random() * 6) + 1
            await sock.sendMessage(jid, { text: `🎲 O dado caiu em: ${n}` })
        }

        if (texto === "!curiosidade") {
            const curiosidade = await getCuriosidade()
            await sock.sendMessage(jid, { text: curiosidade })
        }

        if (texto === "!conselho") {
            const conselho = await getConselho()
            await sock.sendMessage(jid, { text: conselho })
        }

        if (texto === "!xaveco") {
            await sock.sendMessage(jid, {
                text: `😎 ${randomItem(xavecos)}`
            })
        }

        if (texto === "!zoar") {
            await sock.sendMessage(jid, {
                text: `😈 ${randomItem(zoacoes)}`
            })
        }
        if (texto.startsWith("!todos")) {
            const mensagem = texto.replace("!todos", "").trim()

            if (!mensagem) {
                await sock.sendMessage(jid, {
                    text: "❗ Use: !todos sua mensagem"
                })
                return
            }

            // pega todos os participantes do grupo
            const grupo = await sock.groupMetadata(jid)
            const membros = grupo.participants.map(p => p.id)

            await sock.sendMessage(jid, {
                text: `📢 ${mensagem}`,
                mentions: membros
            })
        }
    })
}

startBot()