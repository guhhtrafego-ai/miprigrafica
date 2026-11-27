#!/usr/bin/env python3
"""Gera o zip de publicação do site para enviar no cPanel (public_html).

Uso (na raiz do repositório):

  python3 scripts/gerar-zip.py                 # site completo
  python3 scripts/gerar-zip.py --desde origin/main  # só o que mudou desde a ref
  python3 scripts/gerar-zip.py -o saida.zip    # nome do arquivo

Por que um script: o zip precisa ter caminhos com "/" (o Compress-Archive do
PowerShell grava "\\" e a extração no servidor Linux quebra) e não pode levar
arquivos que são só de desenvolvimento. O limite de upload do cPanel é 25 MB
por arquivo; se o zip passar disso, o script avisa e divide em partes.
"""
import argparse
import os
import subprocess
import sys
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIMITE = 25 * 1024 * 1024

# Pastas e arquivos que nunca vão para o servidor.
EXCLUIR_PASTAS = {
    ".git", ".claude", ".github", "scripts", "node_modules",
    "midiaserviços", "midiaserviços_BACKUP_ORIGINAL",
}
EXCLUIR_ARQUIVOS = {
    "inventario-fotos-midiaservicos.csv", "LOGOFAVICON.jpg", "README.md",
    "CLAUDE.md", ".gitignore", ".DS_Store", "Thumbs.db",
}


def incluir(rel):
    partes = rel.replace("\\", "/").split("/")
    if any(p in EXCLUIR_PASTAS for p in partes[:-1]):
        return False
    if partes[0] in EXCLUIR_PASTAS:
        return False
    return partes[-1] not in EXCLUIR_ARQUIVOS


def todos_os_arquivos():
    for pasta, subpastas, arquivos in os.walk(RAIZ):
        rel_pasta = os.path.relpath(pasta, RAIZ)
        subpastas[:] = sorted(
            d for d in subpastas
            if d not in EXCLUIR_PASTAS
        )
        for nome in sorted(arquivos):
            rel = os.path.normpath(os.path.join(rel_pasta, nome)).replace(os.sep, "/")
            if incluir(rel):
                yield rel


def arquivos_alterados(ref):
    saida = subprocess.check_output(
        ["git", "-c", "core.quotepath=off", "diff", "--name-only", "--diff-filter=ACMR", ref, "--"],
        cwd=RAIZ, text=True, encoding="utf-8",
    )
    # Arquivos novos ainda não adicionados ao git também entram.
    saida += subprocess.check_output(
        ["git", "-c", "core.quotepath=off", "ls-files", "--others", "--exclude-standard"],
        cwd=RAIZ, text=True, encoding="utf-8",
    )
    vistos = []
    for l in saida.splitlines():
        if l and l not in vistos and incluir(l) and os.path.isfile(os.path.join(RAIZ, l)):
            vistos.append(l)
    return vistos


def gravar(nome, arquivos):
    with zipfile.ZipFile(nome, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in arquivos:
            # arcname sempre com "/", que é o que o servidor Linux espera.
            z.write(os.path.join(RAIZ, rel), rel.replace("\\", "/"))
    return os.path.getsize(nome)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--desde", help="ref do git (ex.: main); inclui só os arquivos alterados desde ela")
    ap.add_argument("-o", "--saida", default="miprigrafica-deploy.zip")
    args = ap.parse_args()

    arquivos = arquivos_alterados(args.desde) if args.desde else list(todos_os_arquivos())
    if not arquivos:
        print("Nada para publicar.")
        return 0

    # Divide em partes de até 25 MB (pelo tamanho dos arquivos, sem compressão,
    # o que dá folga: fotos e vídeo já são comprimidos).
    partes, atual, tam = [], [], 0
    for rel in arquivos:
        t = os.path.getsize(os.path.join(RAIZ, rel))
        if atual and tam + t > LIMITE - 512 * 1024:
            partes.append(atual)
            atual, tam = [], 0
        atual.append(rel)
        tam += t
    partes.append(atual)

    base, ext = os.path.splitext(args.saida)
    for i, lista in enumerate(partes, 1):
        nome = args.saida if len(partes) == 1 else "%s-parte%d%s" % (base, i, ext)
        tamanho = gravar(nome, lista)
        print("%s: %d arquivos, %.1f MB" % (nome, len(lista), tamanho / 1024 / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
