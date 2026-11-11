# Novidades

Este ficheiro é o `CHANGELOG.md` em português: as novidades do waypoints, da mais recente para a mais antiga. É mostrado na app (Definições → Novidades).

<!--
Cada entrada tem o mesmo título que a do CHANGELOG.md ("## x.y.z — AAAA-MM-DD"), pela mesma ordem, e
o mesmo número de parágrafos, marcadores, **negritos** e `códigos`. Um teste verifica que os dois
ficheiros correspondem. Escreve para quem usa a app, não para programadores.
-->

## 0.17.0 — 2026-11-11

O waypoints agora fala português (de Portugal). Os telemóveis em português mostram-no em português; escolhe outro idioma em Definições → **Idioma**. As datas e os valores também seguem o idioma.

Se usas um servidor de sincronização, atualiza-o para a 0.8.0 para que as mensagens dele também apareçam em português. Até lá, aparecem em inglês.

## 0.16.0 — 2026-11-01

Numa viagem com dois ou mais viajantes, cada local tem um botão 🙋 **Quero ir** na lista de Locais e um chip na sua página. Toca nele para dizer que gostavas de conhecer o local. A lista mostra quantos querem ir, e a página do local diz quem são.

**Mais desejados primeiro** ordena os locais de cada cidade que ainda não foram visitados pelo número de pessoas que querem ir, e depois os visitados. Se este telemóvel ainda não disse qual é o viajante, a app pergunta quando votas.

Para partilhar os votos numa viagem com um servidor de sincronização, o servidor tem de estar atualizado para a 0.7.0. Até lá, ficam à espera no teu telemóvel, e os links continuam a funcionar.

## 0.15.0 — 2026-11-01

Os trajetos com a mesma referência de reserva aparecem agora juntos em **Ligações**, na vista Reservas do separador Plano, com as escalas, o percurso e o tempo de espera em cada local. Cada trajeto de uma ligação mostra o mesmo cartão na sua própria página.

Se um trajeto parte de um local diferente daquele onde chega o trajeto anterior, ou parte antes de este chegar, aparece um aviso. Os trajetos com mais de um dia de intervalo na mesma referência, como um voo de ida e volta, ficam separados.

## 0.14.0 — 2026-11-01

Cada viagem tem um cartão **Bagagem e tarefas** no separador Viagem: uma lista partilhada com o que levar e o que fazer antes de partir. Adiciona itens, marca-os como feitos, escolhe quem leva cada um, ou começa por um modelo (Praia, Cidade, Caminhada, Esqui).

Para partilhar as listas numa viagem com um servidor de sincronização, o servidor tem de estar atualizado para a 0.6.0. Até lá, ficam no teu telemóvel, e os links continuam a funcionar.

## 0.13.0 — 2026-10-27

Em 📎 Ficheiros, cada estadia, trajeto, atividade, local e despesa tem a sua própria secção dentro do respetivo tipo, com o emoji e o nome como título. Toda a viagem continua em primeiro lugar.

Toca em **Selecionar** para eliminar várias fotos ou documentos de uma vez.

## 0.12.0 — 2026-10-27

O separador 📷 Fotos passou a 📎 Ficheiros. Um seletor no topo escolhe entre Documentos e Fotos. Ambos são agrupados pelo que lhes pertence, com toda a viagem em primeiro lugar.

As fotos aparecem 3 por grupo, com um link "Ver todas" para ver as restantes fotos desse grupo.

## 0.11.1 — 2026-10-15

Preencher um local a partir de um link do Google Maps funciona com mais links, como os que a opção Partilhar do Android dá, e a partir de servidores na Europa. O teu servidor tem de ser atualizado para a 0.5.1.

Quando o servidor não consegue ler um link, diz agora porquê, em vez de "Não foi possível contactar o servidor waypoints", e o link continua a ir para **Link**.

## 0.11.0 — 2026-10-15

Com um servidor de sincronização, traz uma lista partilhada do Google Maps inteira para uma viagem: 📍 Locais → **Importar lista**.

## 0.10.0 — 2026-10-15

Com um servidor de sincronização, um local novo preenche-se sozinho a partir de um link do Google Maps: cola-o e toca em **Preencher**. O teu servidor tem de ser atualizado para a 0.5.0.

## 0.9.4 — 2026-10-15

A seta **‹** no topo de uma viagem volta agora um ecrã atrás, como o botão de voltar do telemóvel. Nos separadores da viagem, continua a levar-te de volta às tuas viagens.

## 0.9.3 — 2026-10-15

Um novo guia explica tudo o que o waypoints faz, com imagens do ecrã. Abre-o em Definições → Acerca de ou no ecrã de boas-vindas.

## 0.9.2 — 2026-10-15

O waypoints continua gratuito. Se quiseres apoiá-lo, há agora um pequeno link "Apoia no Ko-fi" na lista de viagens e em Definições → Acerca de.

## 0.9.1 — 2026-10-15

Vê o teu dinheiro vivo num relance no separador Dinheiro.

- **Dinheiro que sobra**: cada moeda estrangeira em Taxas de câmbio mostra quanto dinheiro te resta, a partir do que trocaste menos o que gastaste em dinheiro.
- **Dinheiro ou cartão**: as linhas das despesas mostram uma pequena etiqueta Dinheiro ou Cartão quando está indicado.
- **Cartão e dinheiro**: uma linha por baixo das categorias reparte o que gastaste em cartão, dinheiro e sem indicação.

## 0.9.0 — 2026-10-13

O relatório da viagem: a viagem toda numa só página, quando terminar.

- **Relatório da viagem**: quanto custou (por categoria, por dia e quem pagou o quê), se todos acertaram contas, o melhor e o pior da viagem com as estrelas e as notas de todos, as estadias e os trajetos, os locais que guardaste mas a que nunca chegaste, uma foto por dia e alguns números para a recordar.
  Abre-o no separador Plano quando a viagem terminar, ou a qualquer altura no separador Viagem para o ver até agora.
- **Duas versões**: o relatório completo para o grupo, e uma versão **para partilhar** com mais alguém, com a viagem e as avaliações mas sem nomes, notas nem fotos. O que custou fica de fora, a menos que o acrescentes.
- **Guarda-o ou envia-o**: imprime-o ou guarda-o como PDF, ou guarda-o como um ficheiro que abre em qualquer navegador, para guardares ou enviares numa conversa.
- **Um relatório para todos**: numa viagem num servidor de sincronização, o relatório fica guardado no servidor quando a viagem termina, para que todos abram o mesmo. Se a viagem mudar depois disso, qualquer pessoa o pode refazer. Um servidor de sincronização tem de ser atualizado para guardar relatórios: até lá, cada telemóvel mostra o seu.

## 0.8.0 — 2026-10-13

Avaliações: lembra-te do que valeu a pena.

- **Avalia o que fizeste**: as atividades, os locais, as estadias e os trajetos ganham um cartão **Avaliações** assim que começam (os locais, assim que os marcas como **Já fui**). Dá de 1 a 5 estrelas, acrescenta uma nota, ou toca em **Não fui**. Cada pessoa do grupo escreve as suas, e aparecem lado a lado.
- **A tua lista por avaliar**: quando as coisas terminam, o separador Plano mostra quantas estão à tua espera. Toca nela para as avaliares uma a seguir à outra e depois vê as avaliações de todos, as mais recentes ou as melhor avaliadas primeiro.
- Um local que está no plano é avaliado através das suas atividades, e a sua página mostra as avaliações delas.
- As avaliações são tuas: se a app não sabe qual é o viajante que és neste telemóvel, pergunta primeiro.
- Viajam nos links e no servidor de sincronização como tudo o resto. Os telemóveis com uma versão mais antiga da app não as mostram, e um servidor de sincronização tem de ser atualizado para as guardar.

## 0.7.0 — 2026-10-13

Dinheiro ou cartão, em todas as despesas.

- **Dinheiro ou cartão também na moeda da viagem**: as despesas na tua própria moeda dizem agora como foram pagas, como as de outras moedas já diziam. Não muda aquilo para que contam: serve para saberes depois quais não vão aparecer na app do teu banco.
- Uma despesa nova começa como paga da mesma forma que a última nessa moeda (cartão se ainda não houver nenhuma), por isso costuma estar já certa. Os pagamentos para acertar contas começam como **Cartão ou banco**.
- As despesas adicionadas antes disto não dizem: abre uma e toca em **Editar** para a indicar.
- Os telemóveis com uma versão mais antiga da app não o mostram para a moeda da viagem, e editar lá uma despesa esquece-o.

## 0.6.0 — 2026-10-13

Documentos para voos com ligação.

- **Uma reserva, todos os voos**: os voos comprados juntos partilham uma referência de reserva. Dá a cada um a mesma, e um documento adicionado a um deles (o bilhete eletrónico, o recibo) aparece em todos.
- Um documento adicionado a um voo de uma reserva com outros é **para todos os voos dessa reserva**, a menos que desmarques, para que um cartão de embarque de um voo possa ficar nesse voo. As fotos ficam no seu próprio voo, a menos que marques. Muda-o depois na página **Editar** do documento.
- Também funciona para comboios, autocarros e ferries na mesma reserva.
- Os telemóveis com uma versão mais antiga da app mostram estes documentos só no voo a que foram adicionados.

## 0.5.0 — 2026-10-13

Cidades, aeroportos e fusos horários, preenchidos por ti.

- **Cidades à medida que escreves**: começa a escrever uma cidade e escolhe-a numa lista das localidades do mundo (com 15 000 habitantes ou mais), com as que já estão na tua viagem no topo. Funciona offline: a lista vem com a app. Escolher uma cidade também define o seu fuso horário.
- **Aeroportos para os voos**: escreve uma cidade, o nome de um aeroporto ou o seu código ("nrt", "heathrow") e escolhe-o. Aparece como "Tokyo (NRT)", e as horas de partida e de chegada passam para o fuso horário de cada aeroporto. Os comboios, autocarros e ferries recebem a lista de cidades.
- **Fusos horários que acompanham a tua viagem**: um item novo fica no fuso horário do sítio onde os teus trajetos te levaram nesse dia. No dia a seguir a um voo para o Japão, as atividades novas ficam na hora do Japão.
- **Moradas**: os campos de morada sugerem as que já estão na viagem, como a do teu hotel para uma atividade lá, e preenchem também a cidade.
- **Pesquisa de moradas online**, se quiseres: ativa-a em Definições → **Pesquisa de moradas** para procurar qualquer morada enquanto escreves. Usa o OpenStreetMap (através do Photon), precisa de internet e envia-lhe o que escreves no campo da morada. Está desativada, a menos que a atives.

## 0.4.0 — 2026-10-09

Fotos e documentos: para a viagem toda, ou para qualquer estadia, trajeto, atividade, local ou despesa.

- **Separador Fotos**: os documentos da viagem no topo (bilhetes, cartões de embarque, reservas, seguros), e as fotos por baixo, por dia.
- **Em qualquer item**: adiciona fotos e documentos a partir de uma estadia, um trajeto, uma atividade, um local ou uma despesa (um recibo, por exemplo). Move um para outro item, ou para a viagem toda, quando quiseres.
- **Offline**: os documentos ficam guardados no teu telemóvel, por isso abrem na porta de embarque sem rede.
- **Partilhados pelo servidor de sincronização**: numa viagem no servidor, todos os que estão nela recebem-nos sozinhos. Os documentos chegam completos; as fotos chegam como pequenas pré-visualizações, e completas quando abres uma. Os links não conseguem levar ficheiros, por isso numa viagem que só está no teu telemóvel eles ficam no teu telemóvel.
- **Só neste telemóvel**: guarda um passaporte ou o teu cartão de embarque só para ti. Nunca é enviado para o servidor, e podes partilhá-lo mais tarde se mudares de ideias.
- As fotos são reduzidas quando as adicionas (para cerca de 1 MB), o que também deixa de fora o sítio onde foram tiradas. Os originais ficam na galeria do teu telemóvel.
- Os ficheiros de cópia de segurança guardam os nomes e as legendas, mas não os próprios ficheiros.

Se tens um servidor de sincronização, atualiza-o para partilhar fotos e documentos: um servidor mais antigo mantém tudo o resto a funcionar, e os ficheiros ficam à espera no teu telemóvel.

## 0.3.0 — 2026-10-09

Um servidor de sincronização opcional: as alterações chegam ao grupo sozinhas.

- **Servidor de sincronização**: liga-te a um servidor waypoints (por exemplo, um num NAS lá de casa) em Definições → **Servidor de sincronização**. As viagens que puseres nele chegam a todos os que o usam, e cada alteração depois disso, sem enviar links. É opcional: tudo funciona sem ele, como antes.
- **Viagens privadas**: uma viagem no servidor só é vista pelas pessoas que estão nela. Escolhe-as no servidor com um toque quando crias a viagem.
- **Grupos mistos**: quem não está no servidor é adicionado pelo nome, como antes, e recebe links. As alterações que te enviam por link também sobem para o servidor.
- **Põe uma viagem no servidor** mais tarde, a partir do separador Viagem. Continua a funcionar da mesma forma, e os links já enviados continuam a funcionar.
- **Estar offline não faz mal**: as alterações feitas sem rede ficam à espera no teu telemóvel e sobem da próxima vez que o servidor for alcançado.
- A adesão é por convite de quem gere o servidor. Uma viagem de que saias fica no seu grupo, com as tuas despesas.

## 0.2.0 — 2026-10-09

Pagamentos com cartão e devolução de parte do que deves.

- **Dinheiro ou cartão**: uma despesa noutra moeda diz agora como foi paga. O dinheiro converte-se à taxa que os teus levantamentos obtiveram, como antes. Para um cartão, escreve o que o banco cobrou.
- **Adiciona o custo do cartão mais tarde**: ainda não aparece na app do teu banco? Guarda a despesa sem ele. Fica marcada como **custo pendente**, conta entretanto à tua taxa de dinheiro, e o separador Dinheiro diz-te quantas estão à espera (e quais são tuas).
- **Devolve só uma parte**: "Registar pagamento" abre agora o pagamento, já preenchido, para poderes mudar o valor. Deves €100 e devolveste €35? Regista €35, e ficam €65 por pagar. **+ Pagamento** em Saldos regista qualquer outro pagamento.

## 0.1.0 — 2026-10-08

A primeira versão do waypoints: as tuas viagens num só sítio, no telemóvel, offline e sem conta.

- **Viagens** com as pessoas que vão, as datas, um fuso horário de casa e a moeda em que contas.
- **Estadias, transportes e atividades** com horas no seu próprio fuso horário, referências de reserva, moradas, números de telefone e links. Toca para copiar uma referência de reserva, ligar ao anfitrião ou obter direções no Google ou no Apple Maps.
- **Plano dia a dia** que mostra onde dormes cada noite e, durante a viagem, o que há hoje e o que vem a seguir.
- **Locais para conhecer**, agrupados por cidade, com imperdíveis, uma marca de visitado e um toque para planear uma visita.
- **Despesas partilhadas** em qualquer moeda, divididas por igual ou por valores exatos, com saldos e o menor número de pagamentos para acertar contas.
- **Taxas de câmbio a partir do teu próprio dinheiro**: regista uma vez um levantamento ou um câmbio ("10 000 JPY por €62,50") e cada despesa nessa moeda é convertida à taxa que realmente obtiveste, comissões incluídas. Vários câmbios são ponderados em média, e um pagamento com cartão pode ter a sua própria taxa.
- **Exportação para o calendário**: descarrega a viagem toda para o Google Calendar ou o Calendário da Apple, ou adiciona itens avulso ao Google Calendar.
- **Partilha com o teu grupo** como um link na conversa. Abri-lo adiciona a viagem, ou junta as alterações de todos. Sem servidor: a viagem viaja dentro do link.
- **Cópias de segurança**: guarda todas as tuas viagens num ficheiro e importa-as noutro telemóvel.
