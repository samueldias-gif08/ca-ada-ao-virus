/* Duas afirmações por tema: uma tentativa nunca repete a anterior. */
window.BOITATA_QUESTIONS = (()=>{
const pairs=[
['Cabos de rede','O cabo de par trançado pode ser utilizado em redes Ethernet.',true,'O par trançado é um meio físico comum em redes Ethernet.','Todo cabo de rede pode alcançar qualquer distância sem perda de sinal.',false,'Cada padrão e meio físico possui limites de distância e qualidade de sinal.'],
['Endereçamento IPv4','Um endereço IPv4 possui 32 bits.',true,'IPv4 utiliza 32 bits, normalmente escritos em quatro octetos decimais.','Cada octeto de um endereço IPv4 pode valer 999.',false,'Um octeto possui oito bits e varia de 0 a 255.'],
['Máscara de sub-rede','A máscara ajuda a identificar a parte de rede de um endereço IPv4.',true,'A máscara separa os bits de rede e de host.','Uma máscara /24 possui 24 bits destinados aos hosts.',false,'O prefixo /24 indica 24 bits de rede, restando oito bits para hosts.'],
['Gateway padrão','O gateway padrão pode encaminhar tráfego para outras redes.',true,'É o próximo salto usado quando não há uma rota mais específica.','O gateway padrão precisa ser um servidor DNS.',false,'Encaminhar pacotes e resolver nomes são funções diferentes.'],
['DNS','O DNS pode resolver nomes de domínio em endereços IP.',true,'Registros A e AAAA associam nomes a endereços IPv4 e IPv6.','O DNS fornece energia elétrica aos computadores.',false,'DNS é um sistema de nomes, não uma fonte de alimentação.'],
['DHCP','O DHCP pode atribuir endereços IP automaticamente.',true,'O serviço concede configurações de rede por um período de concessão.','O DHCP exige que todo cliente receba um IP digitado manualmente.',false,'O DHCP automatiza a entrega de configurações aos clientes.'],
['Redes LAN','Uma LAN pode conectar dispositivos dentro de uma escola.',true,'LAN é uma rede local, geralmente em uma área limitada.','Uma LAN precisa obrigatoriamente estar conectada à Internet.',false,'Serviços locais podem funcionar mesmo sem acesso à Internet.'],
['Redes WAN','Uma WAN pode interligar redes em cidades diferentes.',true,'WANs abrangem áreas geográficas extensas.','WAN é o nome de um tipo de memória RAM.',false,'WAN significa rede de longa distância.'],
['Wi-Fi','Redes Wi-Fi utilizam ondas de rádio.',true,'Wi-Fi permite comunicação sem fio por radiofrequência.','Toda rede Wi-Fi é segura mesmo sem autenticação.',false,'Redes abertas não oferecem as mesmas proteções de uma configuração segura.'],
['Protocolos TCP e UDP','O TCP oferece entrega ordenada e retransmissão de dados.',true,'TCP controla a comunicação e retransmite dados perdidos.','O UDP garante a entrega de todos os datagramas.',false,'UDP não garante entrega, ordem ou retransmissão por si só.'],
['Modelo OSI','O modelo OSI possui sete camadas.',true,'As sete camadas vão da física à aplicação.','A camada física é responsável por interpretar páginas HTML.',false,'A camada física trata da transmissão de sinais e bits.'],
['Modelo TCP/IP','IP participa da camada de Internet do modelo TCP/IP.',true,'IP fornece endereçamento e encaminhamento entre redes.','HTTP é um protocolo da camada física do TCP/IP.',false,'HTTP pertence à camada de aplicação.'],
['Firewall','Um firewall pode filtrar tráfego com base em regras.',true,'As regras podem considerar endereços, portas e outros atributos.','Um firewall elimina a necessidade de atualizar os sistemas.',false,'Atualizações continuam necessárias para corrigir vulnerabilidades.'],
['Segurança de redes','A autenticação multifator pode reduzir o risco de acesso indevido.',true,'Ela exige fatores adicionais além de uma senha.','Compartilhar senhas é uma boa prática de segurança.',false,'Credenciais devem ser individuais e protegidas.'],
['Malware e vírus','Um vírus de computador é um tipo de malware.',true,'Malware é a categoria de software malicioso que inclui vírus.','Todo arquivo recebido por e-mail é seguro.',false,'Anexos podem conter código malicioso e precisam de verificação.'],
['Servidores','Um servidor pode fornecer serviços a outros dispositivos.',true,'Servidores podem oferecer arquivos, páginas web e outros serviços.','Um servidor só pode atender um único cliente durante toda sua operação.',false,'Servidores normalmente atendem vários clientes, conforme sua capacidade.'],
['HTTP e HTTPS','HTTPS utiliza criptografia para proteger a comunicação.',true,'HTTPS utiliza TLS para proteger dados em trânsito.','HTTPS garante que todo conteúdo de um site seja honesto.',false,'A proteção do transporte não garante a honestidade de quem publica o conteúdo.'],
['Portas de rede','Portas de transporte ajudam a identificar serviços.',true,'TCP e UDP usam números de porta na comunicação entre aplicações.','Uma porta TCP é sempre um conector físico do computador.',false,'Portas TCP são identificadores lógicos, diferentes de conectores físicos.'],
['Fibra óptica','Fibra óptica transmite informações por sinais de luz.',true,'A luz percorre a fibra e transporta os dados.','Fibra óptica transporta dados usando corrente elétrica no núcleo.',false,'O meio de transmissão utiliza luz, não corrente elétrica no núcleo.'],
['Endereçamento IPv6','O IPv6 utiliza endereços de 128 bits.',true,'Esse tamanho oferece um espaço de endereçamento muito maior que IPv4.','O IPv6 utiliza apenas 32 bits por endereço.',false,'32 bits é o tamanho do IPv4; IPv6 utiliza 128 bits.'],
['VLAN','VLANs permitem segmentar logicamente uma rede com switches.',true,'VLANs separam domínios de broadcast na infraestrutura de comutação.','Todos os dispositivos em VLANs diferentes se comunicam sem roteamento.',false,'A comunicação entre VLANs normalmente requer roteamento.'],
['Topologias de rede','Na topologia estrela, dispositivos se conectam a um ponto central.',true,'Um switch pode ser o equipamento central de uma estrela.','Uma topologia em anel não possui nenhuma conexão entre seus nós.',false,'Os nós de um anel estão conectados formando um percurso fechado.'],
['Comandos de diagnóstico','O ping pode ajudar a testar a alcançabilidade de um destino.',true,'Ele normalmente utiliza mensagens ICMP; filtros podem impedir respostas.','Uma falha no ping prova sempre que o computador remoto está desligado.',false,'Filtros, perda de pacotes e falhas de rota também podem impedir respostas.'],
['Infraestrutura da Internet','A Internet interliga diversas redes autônomas.',true,'Operadoras e organizações interconectam suas redes para trocar tráfego.','A Internet depende de um único computador central.',false,'Sua infraestrutura é distribuída entre muitas redes e organizações.'],
['Segurança e revisão geral','Backups ajudam a recuperar dados após incidentes.',true,'Cópias verificadas e protegidas reduzem o impacto de perdas e ataques.','Usar a mesma senha em todos os serviços reduz o risco de invasão.',false,'A reutilização permite que uma credencial vazada comprometa vários serviços.']];
return pairs.flatMap((p,i)=>[0,1].map(j=>({id:`Q${i*2+j+1}`,theme:p[0],statement:p[1+j*3],answer:p[2+j*3],explanation:p[3+j*3],difficulty:1+Math.floor(i/9)})));
})();


// Afirmações adicionais para as etapas técnicas.
BOITATA_QUESTIONS.push(...[
['VLAN','O IEEE 802.1Q permite identificar VLANs em quadros Ethernet.',true,'A marcação 802.1Q inclui um identificador de VLAN no quadro.'],
['Topologias de rede','Uma malha completa de n nós possui n × (n − 1) / 2 enlaces bidirecionais.',true,'Cada par de nós precisa de um enlace; a divisão por dois evita contar o mesmo par duas vezes.'],
['Comandos de diagnóstico','O traceroute pode explorar a expiração do TTL para revelar saltos de uma rota.',true,'Roteadores podem responder com ICMP Time Exceeded quando o TTL expira.'],
['Infraestrutura da Internet','BGP é usado para trocar informações de rotas entre sistemas autônomos.',true,'BGP permite anunciar e selecionar rotas entre redes administradas de forma independente.'],
['Segurança e revisão geral','O princípio do menor privilégio recomenda conceder somente as permissões necessárias.',true,'Limitar permissões reduz o impacto de uma credencial comprometida.'],
['Segurança e revisão geral','Uma cópia de backup sempre conectada e gravável é imune a ransomware.',false,'Backups conectados e graváveis também podem ser criptografados; cópias isoladas e testes de restauração são essenciais.']
].map((p,i)=>({id:'T'+i,theme:p[0],statement:p[1],answer:p[2],explanation:p[3],difficulty:3})));

