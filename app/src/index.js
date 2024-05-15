import express from "express";
import { createServer } from "http";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux";
import { join } from "path";
import { hostname } from "os";
import wisp from "wisp-server-node";
import { createBareServer } from "@tomphttp/bare-server-node";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "static")));

app.get('/app', (req, res) => {
  res.sendFile(join(__dirname, './static/index.html'));
});

app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

app.use((req, res) => {
  res.status(404).sendFile(join(publicPath, "404.html"));
});

const server = createServer(app);

server.on("request", (req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  app.handle(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/"))
    wisp.routeRequest(req, socket, head);
  else
    socket.end();
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
  const address = server.address();
  console.log(`http://localhost:${address.port}`);
  console.log(`http://${hostname()}:${address.port}`);
  console.log(
    `http://${address.family === "IPv6" ? `[${address.address}]` : address.address
    }:${address.port}`
  );
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

server.listen(port);
