export interface SeedQuestion {
  subject_name: string;
  category: string;
  question_type: string;
  question_text: string;
  options: string[];
  correct_answer: { type: string; value: number };
  marks: number;
  negative_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export const MASTER_QUESTION_POOL: SeedQuestion[] = [
  // ── 1. DIGITAL ELECTRONICS (20 Questions) ──
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'What is the minimum number of 2-input NAND gates required to implement a 2-input XOR gate?',
    options: ['3', '4', '5', '6'],
    correct_answer: { type: 'mcq', value: 1 }, // 4
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'A 2-input XOR gate requires exactly 4 two-input NAND gates to implement.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'Which flip-flop is free from the race-around condition when J=1 and K=1?',
    options: ['SR Flip-Flop', 'JK Flip-Flop with pulse trigger', 'Master-Slave JK Flip-Flop', 'T Flip-Flop without clock'],
    correct_answer: { type: 'mcq', value: 2 }, // Master-Slave JK Flip-Flop
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Master-Slave JK flip-flop eliminates race-around condition by isolating master and slave clock phases.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'How many select lines are required for a 32-to-1 Multiplexer?',
    options: ['3', '4', '5', '6'],
    correct_answer: { type: 'mcq', value: 2 }, // 5 (2^5 = 32)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'For 2^n inputs, n select lines are required. 2^5 = 32, so 5 select lines.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'In Boolean algebra, the dual of the expression A + (B · C) is:',
    options: ['A · (B + C)', 'A\' + (B\' · C\')', 'A · B · C', '(A + B) · (A + C)'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'To find the dual, replace OR with AND and AND with OR.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'A MOD-16 ripple counter uses how many flip-flops?',
    options: ['2', '4', '8', '16'],
    correct_answer: { type: 'mcq', value: 1 }, // 4 (2^4 = 16)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'A MOD-N counter requires n flip-flops such that 2^n >= N. For N=16, n=4.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'Which logic family has the lowest power dissipation?',
    options: ['TTL', 'ECL', 'CMOS', 'NMOS'],
    correct_answer: { type: 'mcq', value: 2 }, // CMOS
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'CMOS has negligible static power dissipation compared to TTL and ECL.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'Which logic family has the highest switching speed (lowest propagation delay)?',
    options: ['CMOS', 'TTL', 'ECL (Emitter-Coupled Logic)', 'I2L'],
    correct_answer: { type: 'mcq', value: 2 }, // ECL
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'ECL transistors operate in the non-saturated active region, preventing charge storage delays.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'What is the Gray code equivalent of the binary number 1011?',
    options: ['1110', '1101', '1111', '1001'],
    correct_answer: { type: 'mcq', value: 0 }, // 1110
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'G3=B3=1, G2=B3^B2=1^0=1, G1=B2^B1=0^1=1, G0=B1^B0=1^1=0 -> 1110.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'De Morgan\'s first theorem states that (A + B)\' is equal to:',
    options: ['A\' + B\'', 'A\' · B\'', '(A · B)\'', 'A + B\''],
    correct_answer: { type: 'mcq', value: 1 }, // A' . B'
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'NOR is equivalent to bubbled AND: (A + B)\' = A\' · B\'.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'How many 3-to-8 line decoders are needed to construct a 4-to-16 line decoder?',
    options: ['1', '2', '3', '4'],
    correct_answer: { type: 'mcq', value: 1 }, // 2
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Two 3-to-8 decoders with an enable line driven by the 4th input (and an inverter) form a 4-to-16 decoder.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'What type of shift register can load data in parallel and read it out in parallel?',
    options: ['SISO', 'SIPO', 'PISO', 'PIPO'],
    correct_answer: { type: 'mcq', value: 3 }, // PIPO
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Parallel-In Parallel-Out (PIPO) registers have simultaneous parallel data input and output.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'In a 4-variable Karnaugh Map, an isolated 4-cell group (quad) eliminates how many variables?',
    options: ['1', '2', '3', '4'],
    correct_answer: { type: 'mcq', value: 1 }, // 2
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'A group of 2^k minterms eliminates k variables. For quad (2^2=4), 2 variables are eliminated.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'Which circuit converts an octal code to its equivalent binary code?',
    options: ['Multiplexer', 'Demultiplexer', 'Encoder', 'Decoder'],
    correct_answer: { type: 'mcq', value: 2 }, // Encoder
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'An encoder compresses multiple input lines (like 8 octal lines) into a coded binary output.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'A Full Adder can be realized using:',
    options: ['Two Half Adders and one OR gate', 'Two Half Adders and one AND gate', 'One Half Adder and two OR gates', 'Three Half Adders'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Full Adder = 2 Half Adders + 1 OR gate for carry generation.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'Fan-out of a logic gate refers to the:',
    options: ['Maximum power it can deliver', 'Number of standard gate inputs it can reliably drive', 'Voltage swing between high and low states', 'Heat dissipated per unit area'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Fan-out is the maximum number of standard logic inputs that the output of a gate can drive.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'The 2\'s complement of binary number 1010100 is:',
    options: ['0101011', '0101100', '0101000', '1101100'],
    correct_answer: { type: 'mcq', value: 1 }, // 0101100
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: '1\'s complement = 0101011, adding 1 gives 0101100.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'A Johnson counter with n flip-flops has how many distinct states?',
    options: ['n', '2n', '2^n', '2^(n-1)'],
    correct_answer: { type: 'mcq', value: 1 }, // 2n
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'A twisted ring / Johnson counter with n flip-flops generates 2n states.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'Which memory type is non-volatile and can be erased byte-by-byte electrically?',
    options: ['SRAM', 'DRAM', 'EEPROM', 'Flash Memory'],
    correct_answer: { type: 'mcq', value: 2 }, // EEPROM
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'EEPROM allows byte-level electrical erase and write, unlike Flash which is block-erased.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'What is the output frequency of a 4-bit synchronous binary counter driven by a 16 MHz clock at its MSB output Q3?',
    options: ['8 MHz', '4 MHz', '2 MHz', '1 MHz'],
    correct_answer: { type: 'mcq', value: 3 }, // 1 MHz (16 / 16 = 1)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'A 4-bit binary counter divides the clock frequency by 2^4 = 16. 16 MHz / 16 = 1 MHz.'
  },
  {
    subject_name: 'Digital Electronics',
    category: 'Digital Electronics',
    question_type: 'mcq',
    question_text: 'In a digital system, setup time (t_su) is defined as the time:',
    options: ['Data must remain stable after the clock edge', 'Data must remain stable before the clock active edge', 'Clock signal takes to transition from low to high', 'Required for output to settle after clock trigger'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Setup time is the minimum duration the input data must be held stable before the triggering clock edge.'
  },

  // ── 2. MICROPROCESSORS & MICROCONTROLLERS (20 Questions) ──
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'The 8086 microprocessor has a data bus width of __ bits and an address bus width of __ bits.',
    options: ['8, 16', '16, 20', '16, 16', '32, 20'],
    correct_answer: { type: 'mcq', value: 1 }, // 16, 20
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: '8086 is a 16-bit processor with a 20-bit address bus capable of addressing 1 MB of memory.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'In the 8051 microcontroller, which register is used as the default accumulator for arithmetic instructions?',
    options: ['Register B', 'Register A (ACC)', 'Data Pointer (DPTR)', 'Program Counter (PC)'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Register A (ACC) is the primary 8-bit accumulator used in arithmetic and logic operations.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'Which interrupt in the 8086 microprocessor has the highest priority?',
    options: ['NMI (Non-Maskable Interrupt)', 'INTR', 'Divide by Zero (Type 0)', 'Trap / Single Step (Type 1)'],
    correct_answer: { type: 'mcq', value: 2 }, // Divide by Zero
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Type 0 (Divide by Zero error) is an internal hardware exception with the highest priority.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'What is the size of on-chip RAM in the standard 8051 microcontroller?',
    options: ['64 bytes', '128 bytes', '256 bytes', '4 KB'],
    correct_answer: { type: 'mcq', value: 1 }, // 128 bytes
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Standard 8051 contains 128 bytes of internal RAM (addresses 00H to 7FH) and 4 KB on-chip ROM.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'In 8086 segmented memory architecture, the physical address is calculated as:',
    options: ['Segment Register + Offset', '(Segment Register × 10H) + Offset', '(Offset × 10H) + Segment Register', 'Segment Register × Offset'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Physical Address = (Segment Register value << 4) + Offset = (Segment × 16) + Offset.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'Which instruction in 8051 microcontroller is used to exchange data with external data memory (XRAM)?',
    options: ['MOV', 'MOVC', 'MOVX', 'PUSH'],
    correct_answer: { type: 'mcq', value: 2 }, // MOVX
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'MOVX (Move External) transfers data between the accumulator and external RAM.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'The 8255 Programmable Peripheral Interface has how many I/O pins across Port A, B, and C?',
    options: ['16', '20', '24', '32'],
    correct_answer: { type: 'mcq', value: 2 }, // 24
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: '8255 has 24 programmable I/O pins divided into Port A (8), Port B (8), Port C Upper (4), Port C Lower (4).'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'What is the function of the ALE (Address Latch Enable) signal in 8085/8086 processors?',
    options: ['To signal read operation', 'To demultiplex the time-multiplexed address/data bus', 'To acknowledge DMA requests', 'To enable interrupt controllers'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'ALE pulses high during T1 state to latch the lower address lines from the multiplexed AD0-AD15 bus.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'In ARM Cortex-M architecture, the Vector Table starts at address:',
    options: ['0x00000000', '0x08000000', '0x20000000', '0xFFFFFFFF'],
    correct_answer: { type: 'mcq', value: 0 }, // 0x00000000
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'In ARM Cortex-M, address 0x00000000 holds the Initial Main Stack Pointer (MSP) and 0x00000004 holds the Reset vector.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'In 8051, the register DPTR (Data Pointer) is how many bits wide?',
    options: ['8 bits', '16 bits', '20 bits', '32 bits'],
    correct_answer: { type: 'mcq', value: 1 }, // 16 bits
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'DPTR is a 16-bit register composed of two 8-bit registers: DPH (high byte) and DPL (low byte).'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'Which addressing mode is used in the instruction: MOV AX, [BX+SI+08H] ?',
    options: ['Direct Addressing', 'Register Relative', 'Based Indexed with Displacement', 'Register Indirect'],
    correct_answer: { type: 'mcq', value: 2 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Using a base register (BX), index register (SI), and constant displacement (08H) is Based Indexed with Displacement.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'How many total register banks are present in the 8051 microcontroller internal RAM?',
    options: ['2', '4', '8', '16'],
    correct_answer: { type: 'mcq', value: 1 }, // 4
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: '8051 contains 4 register banks (Bank 0 to Bank 3), selected via RS0 and RS1 bits in PSW.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'Which flag in 8086 is set when the result of an arithmetic operation exceeds the signed number capacity?',
    options: ['Carry Flag (CF)', 'Auxiliary Flag (AF)', 'Overflow Flag (OF)', 'Sign Flag (SF)'],
    correct_answer: { type: 'mcq', value: 2 }, // Overflow Flag
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'The Overflow Flag (OF) indicates signed arithmetic overflow, whereas CF indicates unsigned overflow.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'The instruction NOP in 8086 microprocessor performs:',
    options: ['Clears accumulator', 'Performs no operation and consumes 3 clock cycles', 'Resets the stack pointer', 'Halts the CPU until interrupt'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'NOP (No Operation) simply increments PC/IP and takes 3 clock cycles without modifying registers.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'Which pin in 8051 must be connected to VCC to execute code from internal ROM?',
    options: ['RST', 'EA (External Access)', 'PSEN', 'ALE'],
    correct_answer: { type: 'mcq', value: 1 }, // EA
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Connecting EA (pin 31) to VCC enables code execution from internal 4KB ROM; grounded executes external ROM.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'In 8086, pipelining is achieved by splitting the CPU into two independent units called:',
    options: ['ALU and Control Unit', 'Bus Interface Unit (BIU) and Execution Unit (EU)', 'Fetch Unit and Decode Unit', 'Memory Unit and Register Unit'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: '8086 architecture features BIU (which fetches instructions into a 6-byte prefetch queue) and EU (which executes).'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'In an 8051 serial communication setup with Timer 1 in Mode 2, baud rate is determined by:',
    options: ['TH0 register', 'TH1 reload register value', 'TCON register', 'IP register'],
    correct_answer: { type: 'mcq', value: 1 }, // TH1
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'In 8051 serial Mode 1/3, Timer 1 in 8-bit auto-reload mode (TH1) sets the UART baud rate.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'Which instruction in 8086 pushes all 8 general purpose registers onto the stack at once?',
    options: ['PUSHF', 'PUSHA', 'PUSH ALL', 'MOV STACK'],
    correct_answer: { type: 'mcq', value: 1 }, // PUSHA
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'PUSHA pushes AX, CX, DX, BX, SP, BP, SI, and DI onto the stack sequentially.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'In PIC microcontroller, WREG stands for:',
    options: ['Write Register', 'Working Register', 'Word Register', 'Watchdog Register'],
    correct_answer: { type: 'mcq', value: 1 }, // Working Register
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'In PIC microcontrollers, WREG (Working Register) acts as the primary accumulator.'
  },
  {
    subject_name: 'Microprocessors & Microcontrollers',
    category: 'Microprocessors & Microcontrollers',
    question_type: 'mcq',
    question_text: 'What happens to the Stack Pointer (SP) in 8051 immediately following a system RESET?',
    options: ['Initialized to 00H', 'Initialized to 07H', 'Initialized to FFH', 'Remains unchanged'],
    correct_answer: { type: 'mcq', value: 1 }, // 07H
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'On reset, 8051 SP is initialized to 07H, meaning the first PUSH operation will write to address 08H.'
  },

  // ── 3. EMBEDDED SYSTEMS & IOT (20 Questions) ──
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'Which serial communication bus is synchronous, full-duplex, and uses Master Out Slave In (MOSI) lines?',
    options: ['I2C', 'UART', 'SPI (Serial Peripheral Interface)', 'CAN Bus'],
    correct_answer: { type: 'mcq', value: 2 }, // SPI
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'SPI uses 4 lines: MOSI, MISO, SCLK, and SS/CS for full-duplex synchronous transmission.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'How many wires are required for the standard I2C communication protocol?',
    options: ['1 wire', '2 wires (SDA and SCL)', '4 wires', '8 wires'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'I2C uses exactly two bidirectional open-drain lines: Serial Data (SDA) and Serial Clock (SCL).'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'In FreeRTOS, what happens when a task calls vTaskDelay(100)?',
    options: ['The CPU executes a busy-wait loop for 100 ticks', 'The task enters the Blocked state for 100 ticks, yielding CPU to lower/equal priority tasks', 'The task is terminated and deleted', 'The RTOS triggers a watchdog reset'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'vTaskDelay places the calling task in the Blocked state, allowing other tasks to execute.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'The Controller Area Network (CAN) bus protocol was originally developed by Bosch for:',
    options: ['Aerospace flight control', 'Automotive vehicle communications', 'Smart home appliances', 'Cellular base stations'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'CAN bus is a robust automotive multi-master serial bus standard designed by Bosch.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'A Watchdog Timer (WDT) in an embedded microcontroller is used to:',
    options: ['Measure real-time clock frequency', 'Reset the microcontroller if the software gets stuck in an infinite loop', 'Manage battery charging cycles', 'Speed up flash memory write operations'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'If the software fails to refresh ("kick/feed") the watchdog before timeout, the WDT automatically resets the MCU.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'In Pulse Width Modulation (PWM), Duty Cycle is defined as:',
    options: ['(T_OFF / Total Period) × 100%', '(T_ON / Total Period) × 100%', '(T_ON + T_OFF) / Frequency', 'Peak Voltage / RMS Voltage'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Duty cycle is the percentage of one period in which a signal is active (ON).'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'Which wireless protocol is optimized for low-power, long-range IoT sensor networks (up to 10+ km)?',
    options: ['Wi-Fi 6', 'Bluetooth Classic', 'LoRaWAN', 'Zigbee'],
    correct_answer: { type: 'mcq', value: 2 }, // LoRaWAN
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'LoRaWAN uses chirp spread spectrum for long-range, ultra-low-power IoT communications.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'What is priority inversion in a real-time operating system (RTOS)?',
    options: ['A low-priority task preempting a high-priority task directly', 'A high-priority task being indirectly blocked by a lower-priority task holding a shared mutex', 'Tasks being assigned random priorities by the scheduler', 'Interrupts having lower priority than application tasks'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Priority inversion occurs when a medium-priority task preempts a low-priority task that is holding a lock needed by a high-priority task.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'Which mechanism is commonly used in RTOS to solve Priority Inversion?',
    options: ['Round-robin scheduling', 'Priority Inheritance Protocol', 'Disabling all interrupts permanently', 'Increasing timer tick frequency'],
    correct_answer: { type: 'mcq', value: 1 }, // Priority Inheritance
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Priority Inheritance temporarily boosts the priority of the lock-holding lower task to that of the highest waiting task.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'In an ADC (Analog-to-Digital Converter), what is the resolution of a 10-bit converter with a 5V reference?',
    options: ['4.88 mV', '9.76 mV', '19.5 mV', '2.44 mV'],
    correct_answer: { type: 'mcq', value: 0 }, // 5V / 1024 = 4.88 mV
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Resolution = Vref / (2^10) = 5.0 V / 1024 = 4.8828 mV per LSB step.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'Which protocol is standard for lightweight Publish/Subscribe messaging in IoT cloud platforms?',
    options: ['HTTP POST', 'MQTT (Message Queuing Telemetry Transport)', 'FTP', 'Telnet'],
    correct_answer: { type: 'mcq', value: 1 }, // MQTT
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'MQTT is an extremely lightweight, broker-based publish/subscribe network protocol ideal for constrained IoT devices.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'The ESP32 microcontroller features dual-core processing based on which architecture?',
    options: ['ARM Cortex-M4', 'Xtensa LX6 32-bit', 'AVR RISC', 'MIPS32'],
    correct_answer: { type: 'mcq', value: 1 }, // Xtensa LX6
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'ESP32 contains a Tensilica Xtensa dual-core 32-bit LX6 microprocessor operating up to 240 MHz.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'In embedded C, declaring a variable with the "volatile" keyword informs the compiler that:',
    options: ['The variable should be stored only in CPU registers', 'The variable value may change asynchronously (e.g. by hardware/ISR) and must not be optimized away', 'The variable is constant and read-only', 'The variable has global scope across all translation units'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Volatile prevents compiler caching in registers for variables modified by hardware registers or ISRs.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'What is the standard baud rate for default UART serial debug consoles in many microcontroller dev boards?',
    options: ['1200 bps', '9600 bps or 115200 bps', '1 Mbps', '10 Mbps'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: '9600 bps and 115200 bps are standard UART baud rates for terminal logging.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'In CAN bus protocol, dominant state represents bit __ and recessive state represents bit __.',
    options: ['1, 0', '0, 1', 'High impedance, Low', 'Differential, Single-ended'],
    correct_answer: { type: 'mcq', value: 1 }, // 0, 1
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'In CAN bus physical signaling, Dominant is logic 0 (actively driven) and Recessive is logic 1 (passive pull-up).'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'Which memory type in an embedded SoC holds the primary bootloader code executed at power-up?',
    options: ['SRAM', 'Boot ROM (Mask ROM)', 'External SD Card', 'DRAM'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Internal Boot ROM contains the unalterable First Stage Boot Loader (FSBL) executed on reset.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'What is the purpose of an optocoupler (opto-isolator) in microcontroller interface circuits?',
    options: ['To amplify digital audio signals', 'To provide electrical galvanic isolation between low-voltage MCU and high-voltage loads', 'To measure ambient light intensity', 'To regulate DC supply voltage'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Optocouplers transfer electrical signals using light waves to prevent high voltages from damaging sensitive MCU circuitry.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'In a hard real-time system, missing a task deadline results in:',
    options: ['Slightly degraded user experience', 'Catastrophic system failure or safety hazard', 'Automatic retry at lower clock frequency', 'No observable impact'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'In hard real-time systems (e.g. airbag deployment, pacemakers), missing a deadline is considered total system failure.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'Direct Memory Access (DMA) allows peripherals to:',
    options: ['Directly transfer data to/from memory without continuous CPU intervention', 'Overclock the processor ALU', 'Bypass cache memory coherency protocols', 'Increase supply voltage during burst modes'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'DMA offloads bulk data transfers between I/O and RAM, freeing the CPU for compute tasks.'
  },
  {
    subject_name: 'Embedded Systems',
    category: 'Embedded Systems',
    question_type: 'mcq',
    question_text: 'What is the function of pull-up resistors on the I2C bus lines?',
    options: ['To limit peak current during short circuits', 'To pull the open-drain lines high when no device is pulling them low', 'To filter high-frequency noise oscillations', 'To provide AC impedance matching at high frequencies'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'I2C drivers are open-drain; pull-up resistors restore lines to logic HIGH (VDD) when releases occur.'
  },

  // ── 4. VLSI DESIGN (20 Questions) ──
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In CMOS inverter design, why is the PMOS transistor typically sized wider than the NMOS transistor (W_p ≈ 2 to 3 × W_n)?',
    options: ['PMOS threshold voltage is higher', 'Electron mobility (μ_n) is roughly 2.5 times higher than hole mobility (μ_p)', 'To decrease static leakage current', 'To minimize gate capacitance'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Because electrons move faster than holes (μ_n ≈ 2.5 μ_p), PMOS must be wider to achieve equal rise and fall times.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In static CMOS logic, how many total transistors (NMOS + PMOS) are required to build an N-input NAND gate?',
    options: ['N', '2N', 'N + 1', '2^N'],
    correct_answer: { type: 'mcq', value: 1 }, // 2N
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'An N-input CMOS gate uses N PMOS transistors in pull-up and N NMOS transistors in pull-down (total 2N).'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'Hold time (t_hold) in sequential digital circuits is defined as:',
    options: ['Time data must be held stable after the active clock edge', 'Time data must arrive before the clock edge', 'Time required for the output to switch', 'Minimum clock pulse width high'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Hold time is the duration the data input must remain valid after the clock edge to prevent race conditions.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'Which Verilog keyword is used to declare a hardware register storage in procedural blocks?',
    options: ['wire', 'reg', 'assign', 'inout'],
    correct_answer: { type: 'mcq', value: 1 }, // reg
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'In Verilog-2001, "reg" represents data storage variables assigned inside "always" or "initial" blocks.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'What is the primary cause of static power dissipation in deep submicron CMOS technology nodes (e.g. < 7nm)?',
    options: ['Dynamic charging and discharging of load capacitance', 'Subthreshold leakage and gate oxide tunneling leakage', 'Short-circuit crowbar current during switching', 'Thermal radiation from interconnect vias'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'As channel length and oxide thickness shrink, subthreshold leakage and quantum gate tunneling dominate static power.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In FinFET technology, the channel is surrounded on __ sides by the gate.',
    options: ['1 side (planar)', '2 sides', '3 sides (tri-gate)', '4 sides (GAA)'],
    correct_answer: { type: 'mcq', value: 2 }, // 3 sides
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'FinFET uses a 3D fin wrapped by the gate on three sides, providing superior electrostatic channel control.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In CMOS Stick Diagrams, which color conventionally represents the Polysilicon gate layer?',
    options: ['Green (NMOS active)', 'Red (Polysilicon)', 'Blue (Metal 1)', 'Yellow (PMOS active)'],
    correct_answer: { type: 'mcq', value: 1 }, // Red
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'In Mead-Conway stick diagram color coding, Red represents Polysilicon.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In Verilog HDL, the non-blocking assignment operator is written as:',
    options: ['=', '<=', ':=', '=='],
    correct_answer: { type: 'mcq', value: 1 }, // <=
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: '<= is the non-blocking assignment operator used for sequential flip-flop modeling.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'Design Rule Checking (DRC) in IC layout verification checks for:',
    options: ['Logical equivalence between schematic and layout', 'Geometric design constraints like minimum width, spacing, and enclosure rules', 'Timing slack and setup violations', 'Power grid voltage drop IR drops'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'DRC verifies that layout geometries satisfy foundry process rules for manufacturability.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'What is LVS in the physical design flow?',
    options: ['Logical Voltage Scaling', 'Layout Versus Schematic comparison', 'Linear Vector Space', 'Leakage Voltage Suppression'],
    correct_answer: { type: 'mcq', value: 1 }, // Layout Versus Schematic
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'LVS verifies that the extracted layout netlist is topologically identical to the electrical schematic netlist.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'The body effect (substrate bias effect) in MOSFETs causes:',
    options: ['An increase in threshold voltage (V_th) when source-to-substrate voltage (V_SB) increases', 'A decrease in drain breakdown voltage', 'Complete suppression of channel pinch-off', 'Zero subthreshold slope factor'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Body effect increases threshold voltage Vth as reverse bias V_SB widens the channel depletion region.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'Which component in FPGA architectures provides programmable combinational logic functions?',
    options: ['Lookup Table (LUT)', 'I/O Block (IOB)', 'Interconnect Crossbar', 'Global Clock Tree'],
    correct_answer: { type: 'mcq', value: 0 }, // Lookup Table (LUT)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'FPGAs use SRAM-based Look-Up Tables (LUTs, typically 4-input or 6-input) to implement arbitrary Boolean logic.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'Clock Skew is defined as:',
    options: ['Difference in clock arrival times at different flip-flops across the chip', 'The total duration of the clock period', 'The variation of clock frequency over temperature', 'The rise time of the clock pulse'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Clock skew is the spatial variation in arrival times of a clock edge at different spatial locations in a circuit.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'Dynamic power dissipation in CMOS circuits is given by the formula:',
    options: ['P = I_leak × V_DD', 'P = α × C_L × V_DD^2 × f_clk', 'P = V_DD / R_on', 'P = C_L × V_DD × f_clk'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Dynamic power P_dyn = α · C_load · V_dd² · f, where α is the switching activity factor.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'What is the purpose of Clock Gating in low-power ASIC design?',
    options: ['To speed up the clock frequency for memory blocks', 'To disable clock signals to inactive modules and eliminate unnecessary dynamic switching power', 'To equalize clock arrival times across flip-flops', 'To eliminate setup time violations'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Clock gating turns off clock trees driving idle functional units, eliminating dynamic CV²f power.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In Static Timing Analysis (STA), a setup time violation is resolved by:',
    options: ['Increasing the clock period or reducing combinational path delay (e.g. buffer insertion/sizing)', 'Adding delay elements to the data path', 'Increasing hold time requirements', 'Decreasing supply voltage'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Setup violations occur when data arrives too late; fixing requires speeding up the data path or slowing the clock.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In CMOS fabrication, the LOCOS process was historically used for:',
    options: ['Creating gate dielectric layers', 'Dielectric isolation between adjacent transistor active areas', 'Doping source/drain regions', 'Planarizing metal layers'],
    correct_answer: { type: 'mcq', value: 1 }, // Local Oxidation of Silicon
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'LOCOS (Local Oxidation of Silicon) provided field oxide isolation between transistors before STI took over.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'What causes Latch-up in bulk CMOS integrated circuits?',
    options: ['Parasitic bipolar npn and pnp transistors forming a positive feedback SCR path between VDD and GND', 'High clock jitter on the distribution tree', 'Electromigration in power lines', 'Channel length modulation'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Parasitic BJT structures form a silicon-controlled rectifier (SCR) that can trigger a devastating short circuit between VDD and ground.'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'In Verilog, which construct creates a continuous combinational logic assignment?',
    options: ['initial', 'always @(posedge clk)', 'assign out = a & b;', 'forever'],
    correct_answer: { type: 'mcq', value: 2 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'The "assign" statement implements continuous dataflow assignments on nets (wire).'
  },
  {
    subject_name: 'VLSI Design',
    category: 'VLSI Design',
    question_type: 'mcq',
    question_text: 'Which metric measures the ease of testing an integrated circuit design (DFT)?',
    options: ['Controllability and Observability', 'Transconductance and Output Resistance', 'Die Yield and Wafer Diameter', 'Propagation Delay and Rise Time'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Testability (DFT) is quantified by controllability (ability to set internal nodes) and observability (ability to measure internal nodes).'
  },

  // ── 5. SIGNALS & SYSTEMS (20 Questions) ──
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'According to the Nyquist-Shannon sampling theorem, to avoid aliasing, a continuous bandlimited signal with maximum frequency f_m must be sampled at a rate f_s such that:',
    options: ['f_s < f_m', 'f_s = f_m', 'f_s >= 2 · f_m', 'f_s = f_m / 2'],
    correct_answer: { type: 'mcq', value: 2 }, // f_s >= 2 f_m
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'The Nyquist rate is f_Nyquist = 2 · f_max to ensure perfect reconstruction without spectral overlap.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'An LTI (Linear Time-Invariant) continuous-time system is BIBO stable if and only if its impulse response h(t) satisfies:',
    options: ['h(t) = 0 for all t < 0', '∫ |h(t)| dt < ∞ (absolutely integrable)', 'h(t) is periodic', 'H(s) has poles on the imaginary axis'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'A system is Bounded-Input Bounded-Output (BIBO) stable if its impulse response is absolutely integrable.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'Convolution in the time domain corresponds to __ in the frequency domain.',
    options: ['Differentiation', 'Integration', 'Multiplication', 'Addition'],
    correct_answer: { type: 'mcq', value: 2 }, // Multiplication
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'By the Convolution Property of Fourier/Laplace transforms: F{x(t) * h(t)} = X(ω) · H(ω).'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'What is the Laplace transform of the unit step function u(t)?',
    options: ['1', '1/s (for Re(s) > 0)', '1/s^2', 's'],
    correct_answer: { type: 'mcq', value: 1 }, // 1/s
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'L{u(t)} = ∫ e^(-st) dt from 0 to ∞ = 1/s with ROC Re(s) > 0.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'The Region of Convergence (ROC) of the Z-transform for a causal and stable discrete-time LTI system:',
    options: ['Must exclude the unit circle |z| = 1', 'Must include the unit circle |z| = 1 and extend outward to infinity', 'Must be confined inside |z| < 0.5', 'Consists only of the origin z = 0'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'For causal stability, all poles must lie inside the unit circle, and the ROC extends from the outermost pole outward, enclosing |z|=1.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'The Fast Fourier Transform (FFT) algorithm reduces the computational complexity of an N-point DFT from O(N^2) to:',
    options: ['O(N)', 'O(N log2 N)', 'O(log2 N)', 'O(N^1.5)'],
    correct_answer: { type: 'mcq', value: 1 }, // O(N log2 N)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Cooley-Tukey FFT exploits symmetry and periodicity to reduce DFT operations from N² to N log₂ N.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'If a signal x(t) is even, its Fourier transform X(ω) is always:',
    options: ['Purely imaginary and odd', 'Real and even', 'Complex and odd', 'Zero for all positive frequencies'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Real even signals have real and even Fourier transforms.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'What is the Z-transform of the discrete unit impulse δ[n]?',
    options: ['1 (for all z)', '1 / (1 - z^(-1))', 'z', '0'],
    correct_answer: { type: 'mcq', value: 0 }, // 1
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Z{δ[n]} = ∑ δ[n] z^(-n) = 1 · z^0 = 1, valid for the entire complex z-plane.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'A continuous-time system with input-output relationship y(t) = x(2t) is:',
    options: ['Linear and Time-Invariant', 'Linear and Time-Variant', 'Non-linear and Time-Invariant', 'Causal and Time-Invariant'],
    correct_answer: { type: 'mcq', value: 1 }, // Linear and Time-Variant
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Time-scaling (compression) preserves linearity but violates time-invariance (delaying input produces x(2t - 2t0) != y(t - t0)).'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'The fundamental period T_0 of the continuous-time signal x(t) = cos(10π t) + sin(25π t) is:',
    options: ['0.1 s', '0.2 s', '0.4 s', '2.5 s'],
    correct_answer: { type: 'mcq', value: 2 }, // 0.4 s
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'T1 = 2π / 10π = 0.2s = 2/10; T2 = 2π / 25π = 0.08s = 2/25. LCM(2/10, 2/25) = LCM(2,2)/GCD(10,25) = 2/5 = 0.4s.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'What is the energy of a unit step signal u(t)?',
    options: ['0', '0.5', '1', 'Infinite (Energy is infinite, Power is finite)'],
    correct_answer: { type: 'mcq', value: 3 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'u(t) is a power signal with average power P = 0.5 and infinite total energy.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'An ideal low-pass filter with a rectangular frequency response has an impulse response shaped like a:',
    options: ['Gaussian pulse', 'Sinc function', 'Exponential decay', 'Triangular pulse'],
    correct_answer: { type: 'mcq', value: 1 }, // Sinc
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'The inverse Fourier transform of a rectangular window rect(ω) is a sinc function sinc(ω_c t / π).'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'What is the Fourier transform of the Dirac delta function δ(t)?',
    options: ['1', '2π δ(ω)', '1 / (jω)', '0'],
    correct_answer: { type: 'mcq', value: 0 }, // 1
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'F{δ(t)} = ∫ δ(t) e^(-jωt) dt = e^0 = 1 (constant spectrum containing all frequencies equally).'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'In discrete-time systems, an FIR (Finite Impulse Response) filter is always:',
    options: ['Inherently stable', 'Subject to limit-cycle oscillations', 'Non-causal in all implementations', 'Unstable without negative feedback'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'FIR filters have all poles at z = 0, so they are always BIBO stable.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'What does Parseval\'s theorem state for continuous-time signals?',
    options: ['Total energy in time domain equals total energy in frequency domain divided by 2π', 'Impulse response equals frequency response', 'Convolution in time is multiplication in frequency', 'Phase spectrum is the derivative of magnitude spectrum'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: '∫ |x(t)|² dt = (1 / 2π) ∫ |X(ω)|² dω (Conservation of energy across domains).'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'The Laplace transform of e^(-at) · u(t) is:',
    options: ['1 / (s + a) with ROC Re(s) > -a', '1 / (s - a)', 'a / (s^2 + a^2)', 's / (s + a)'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'L{e^(-at) u(t)} = 1 / (s + a) for Re(s) > -a.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'A causal continuous-time LTI system has transfer function H(s) = (s - 2) / ((s + 3)(s + 5)). The system is:',
    options: ['Stable because all poles are in the left half of the s-plane', 'Unstable because of the right half zero at s = +2', 'Marginally stable', 'Non-linear'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Stability depends exclusively on poles. The poles are at s = -3 and s = -5 (both LHP), hence it is stable.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'The cross-correlation of two real energy signals x(t) and y(t) at zero lag R_xy(0) represents:',
    options: ['The total power of x(t)', 'The inner product (similarity) between the two signals', 'The phase difference between the signals', 'The impulse response of the combined system'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'R_xy(0) = ∫ x(t) y(t) dt, which measures similarity / mutual energy between two waveforms.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'The discrete-time Fourier transform (DTFT) of a discrete sequence x[n] is always:',
    options: ['A continuous and periodic function of frequency ω with period 2π', 'A discrete sequence in frequency', 'Zero everywhere except at harmonic multiples', 'An aperiodic continuous function'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'DTFT produces a continuous spectrum that repeats periodically every 2π radians.'
  },
  {
    subject_name: 'Signals & Systems',
    category: 'Signals & Systems',
    question_type: 'mcq',
    question_text: 'What is the effect of multiplying a time signal x(t) by e^(j ω_0 t)?',
    options: ['Shifts the frequency spectrum by +ω_0 (Frequency Shift property)', 'Scales the amplitude by ω_0', 'Differentiates the spectrum', 'Reverses time direction'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'F{x(t) e^(j ω0 t)} = X(ω - ω0), which shifts the spectrum center by ω0.'
  },

  // ── 6. ANALOG CIRCUITS (20 Questions) ──
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'An ideal operational amplifier (Op-Amp) has:',
    options: ['Zero input impedance and infinite output impedance', 'Infinite input impedance, zero output impedance, and infinite open-loop gain', 'Zero gain and infinite bandwidth', 'Unit gain and zero common-mode rejection'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Ideal Op-Amp properties: Zin = ∞, Zout = 0, Open Loop Gain Aol = ∞, Bandwidth = ∞, CMRR = ∞.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'What is the voltage gain of an ideal Op-Amp Voltage Follower (Buffer) circuit?',
    options: ['0', '+1', '-1', 'Infinity'],
    correct_answer: { type: 'mcq', value: 1 }, // +1
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'A voltage follower with non-inverting feedback has unity voltage gain (Av = 1).'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'The Common Mode Rejection Ratio (CMRR) of a differential amplifier is defined as:',
    options: ['A_d / A_c (Differential Gain / Common Mode Gain)', 'A_c / A_d', 'A_d × A_c', '1 / (A_d + A_c)'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'CMRR = |Ad / Ac|, measuring the ability to amplify differential signals while rejecting common noise.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'Slew rate of an Op-Amp is defined as:',
    options: ['Maximum output current delivery', 'Maximum rate of change of output voltage with respect to time (dV_out / dt)', 'Ratio of input offset voltage to temperature', 'Small-signal unity gain frequency'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Slew rate is the maximum possible rate of change of output voltage, typically measured in V/μs.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'In a Bipolar Junction Transistor (BJT) operating in the Active region:',
    options: ['Emitter-Base junction is Forward Biased, Collector-Base junction is Reverse Biased', 'Both junctions are Forward Biased', 'Both junctions are Reverse Biased', 'EB is Reverse Biased, CB is Forward Biased'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Forward-active mode requires EBJ forward-biased and CBJ reverse-biased for linear amplification.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'Barkhausen Criterion for sustained oscillations requires:',
    options: ['Loop gain |Aβ| = 1 and total loop phase shift ∠Aβ = 0° (or 360°)', '|Aβ| < 1 and phase shift 90°', '|Aβ| = 0 and phase shift 180°', '|Aβ| >> 100 with negative feedback'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Sustained oscillation requires magnitude of loop gain |Aβ| = 1 and net loop phase shift of 0° (or multiples of 360°).'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'A Zener diode is primarily designed to operate in which region of its V-I characteristic?',
    options: ['Forward conduction region', 'Reverse breakdown region', 'Cut-off region', 'Negative resistance region'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Zener diodes maintain a constant voltage across their terminals when reverse-biased into breakdown.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'In an inverting amplifier with input resistor R1 = 10 kΩ and feedback resistor Rf = 100 kΩ, the closed-loop voltage gain is:',
    options: ['+10', '-10', '+11', '-100'],
    correct_answer: { type: 'mcq', value: 1 }, // -10
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Gain Av = -Rf / R1 = -100k / 10k = -10.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'What is the primary function of negative feedback in analog amplifiers?',
    options: ['Increases closed-loop gain', 'Stabilizes gain, increases bandwidth, and reduces distortion', 'Makes the amplifier oscillate', 'Increases input offset voltage'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Negative feedback trades gain for desensitized gain stability, wider bandwidth, and reduced distortion.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'The 555 Timer IC configured in Astable Multivibrator mode produces:',
    options: ['A single one-shot pulse on trigger', 'A continuous continuous square wave output without any external trigger', 'A pure sine wave', 'A stable DC regulated voltage'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'In astable mode, the 555 timer operates as a free-running oscillator generating continuous square pulses.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'The Early Effect in BJT transistors causes:',
    options: ['Base width modulation resulting in a finite output resistance r_o in active mode', 'Complete destruction of the base region', 'Excessive emitter contact resistance', 'Zero collector current at high V_CE'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Increasing V_CE widens the collector-base depletion region, narrowing the neutral base and increasing I_C slightly (Early Effect).'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'A Wien Bridge Oscillator is widely used to generate stable sine waves in which frequency range?',
    options: ['Audio frequencies (20 Hz to 200 kHz)', 'Microwave frequencies (> 1 GHz)', 'Radio frequencies (10 MHz to 100 MHz)', 'Optical frequencies'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Wien Bridge oscillators use RC feedback networks optimal for audio and low-frequency sine generation (f0 = 1 / (2πRC)).'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'In a full-wave bridge rectifier with input AC frequency 50 Hz, the ripple frequency at the output is:',
    options: ['25 Hz', '50 Hz', '100 Hz', '200 Hz'],
    correct_answer: { type: 'mcq', value: 2 }, // 100 Hz
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Full-wave rectifiers conduct on both half cycles, doubling output ripple frequency to 2 × 50 Hz = 100 Hz.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'Which power amplifier class offers the highest theoretical power conversion efficiency?',
    options: ['Class A (max 25-50%)', 'Class B (max 78.5%)', 'Class AB', 'Class D (Switching, up to 90-95%)'],
    correct_answer: { type: 'mcq', value: 3 }, // Class D
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Class D amplifiers operate transistors as switches (fully on or fully off), achieving theoretical efficiencies > 90%.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'In an instrumentation amplifier using 3 Op-Amps, the overall gain is conveniently adjusted by changing:',
    options: ['A single gain resistor (R_gain)', 'All 7 resistors simultaneously', 'The power supply voltage', 'The input capacitor coupling value'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'The classic 3-opamp instrumentation amplifier controls differential gain through a single resistor Rg without unbalancing CMRR.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'What is the purpose of an emitter bypass capacitor in a common-emitter BJT amplifier?',
    options: ['To provide AC ground to the emitter and maximize AC voltage gain', 'To block DC power from the base', 'To increase input resistance at DC', 'To prevent thermal runaway at DC'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'The bypass capacitor shorts RE to ground for AC signals, boosting AC voltage gain while preserving DC bias stability.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'Thermal runaway in a BJT power amplifier occurs because:',
    options: ['As temperature rises, collector leakage current I_CBO increases, which further increases collector current and junction temperature', 'Base resistor value drops to zero', 'Emitter-base junction breaks down under light', 'Cooling fans draw too much current'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Positive thermal feedback (temperature ↑ -> IC ↑ -> power dissipation ↑ -> temperature ↑) leads to device destruction.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'A Schmitt Trigger circuit is an analog comparator with:',
    options: ['Negative feedback and zero gain', 'Positive feedback providing hysteresis to prevent false switching from noise', 'No feedback and infinite slew rate', 'Internal integration capacitors'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Schmitt triggers use positive feedback to create two distinct switching threshold voltages (UTP and LTP) for noise immunity.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'In MOSFET small-signal models, transconductance g_m is defined as:',
    options: ['∂i_D / ∂v_GS (at constant v_DS)', '∂v_DS / ∂i_D', '∂i_G / ∂v_GS', 'v_GS / v_DS'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Transconductance gm = ∂iD / ∂vGS represents the change in drain current per unit change in gate-to-source voltage.'
  },
  {
    subject_name: 'Analog Circuits',
    category: 'Analog Circuits',
    question_type: 'mcq',
    question_text: 'The Miller Theorem states that a feedback capacitor C_f connected between input and inverting output of gain -A appears at the input as an effective capacitance of:',
    options: ['C_in = C_f', 'C_in = C_f · (1 + A)', 'C_in = C_f / (1 + A)', 'C_in = C_f · A^2'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Miller effect multiplies feedback capacitance by (1 + Av), creating a dominant low-frequency input pole.'
  },

  // ── 7. COMMUNICATION SYSTEMS (20 Questions) ──
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'The total power P_t in an Amplitude Modulated (AM) wave with carrier power P_c and modulation index μ is:',
    options: ['P_t = P_c · (1 + μ^2 / 2)', 'P_t = P_c · (1 + μ)', 'P_t = P_c · μ^2', 'P_t = P_c / 2'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Total AM power = Carrier power + Sideband power = Pc (1 + μ² / 2).'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'According to Carson\'s Rule, the approximate transmission bandwidth of a Frequency Modulated (FM) signal is:',
    options: ['BW = 2 · Δf', 'BW = 2 · (Δf + f_m)', 'BW = Δf + 2 f_m', 'BW = 4 · Δf'],
    correct_answer: { type: 'mcq', value: 1 }, // 2 (Δf + fm)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Carson\'s rule approximates 98% FM power bandwidth as BW ≈ 2(Δf + fm) = 2 fm (β + 1).'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In a Superheterodyne AM receiver with intermediate frequency IF = 455 kHz, what is the Image Frequency when tuned to 1000 kHz (using high-side injection)?',
    options: ['545 kHz', '1455 kHz', '1910 kHz', '2000 kHz'],
    correct_answer: { type: 'mcq', value: 2 }, // 1000 + 2*455 = 1910 kHz
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'f_image = f_signal + 2 · IF = 1000 kHz + 2(455 kHz) = 1910 kHz.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'Shannon-Hartley theorem gives the maximum channel capacity C of a bandlimited channel with bandwidth B and signal-to-noise ratio SNR as:',
    options: ['C = B · log2(1 + SNR) bits/sec', 'C = 2B · log2(SNR)', 'C = B · SNR', 'C = log2(1 + B · SNR)'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Shannon channel capacity C = B log₂(1 + S/N) in bits per second.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In Pulse Code Modulation (PCM), if the number of quantization bits per sample is increased from n to (n + 1), the Signal-to-Quantization-Noise Ratio (SQNR) improves by approximately:',
    options: ['3 dB', '6 dB', '10 dB', '12 dB'],
    correct_answer: { type: 'mcq', value: 1 }, // 6 dB (6.02 dB)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Each added bit doubles quantization levels, improving SQNR by ~6.02 dB (SQNR ≈ 1.76 + 6.02n dB).'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'Which digital modulation technique transmits data by shifting the phase of the carrier wave between 4 distinct constellation points (0°, 90°, 180°, 270°)?',
    options: ['BPSK', 'QPSK (Quadrature Phase Shift Keying)', 'FSK', 'OOK'],
    correct_answer: { type: 'mcq', value: 1 }, // QPSK
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'QPSK encodes 2 bits per symbol into 4 orthogonal phase states.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'What is the radiation resistance of an ideal half-wave dipole antenna in free space?',
    options: ['50 Ω', '73 Ω (≈ 73.13 Ω)', '120π Ω (377 Ω)', '300 Ω'],
    correct_answer: { type: 'mcq', value: 1 }, // 73 Ω
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'A resonant half-wave dipole antenna in free space exhibits an input radiation resistance of approx 73.13 Ω.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In cellular communications, frequency reuse refers to:',
    options: ['Using different frequencies in the same cell', 'Using the same carrier frequencies in non-adjacent geographic cells separated by sufficient distance', 'Broadcasting on all frequencies simultaneously', 'Modulating frequency with digital voice data'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Frequency reuse allows multiple geographically separated cells to reuse frequencies without co-channel interference.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'Orthogonal Frequency Division Multiplexing (OFDM) is resilient against multipath fading because:',
    options: ['It divides the high-rate data stream into many narrow-band orthogonal subcarriers with long symbol duration', 'It uses only analog modulation', 'It eliminates the need for antennas', 'It transmits only on high-frequency microwave bands'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'OFDM subcarrier symbol duration is much longer than the channel delay spread, converting frequency-selective fading into flat fading.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'Which noise type is caused by thermal agitation of electrons inside a conductor and is present in all electrical circuits?',
    options: ['Flicker (1/f) noise', 'Johnson-Nyquist (Thermal) noise', 'Shot noise', 'Transit time noise'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Thermal noise power Pn = 4kTRB is generated by thermal motion of charge carriers.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In Delta Modulation, slope overload distortion occurs when:',
    options: ['The step size Δ is too large relative to the input slope', 'The input signal rate of change exceeds the maximum step rate (d m(t)/dt > Δ / T_s)', 'The input signal is zero', 'The quantization noise is zero'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Slope overload happens when input signal changes faster than the delta modulator staircase can climb.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'What is the theoretical maximum modulation efficiency (sideband power / total power) of standard AM with 100% modulation (μ = 1)?',
    options: ['33.3% (1/3)', '50%', '66.7%', '100%'],
    correct_answer: { type: 'mcq', value: 0 }, // 33.3%
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Sideband power = Pc/2; total power = Pc(1 + 0.5) = 1.5 Pc. Efficiency = 0.5/1.5 = 33.33%.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In optical fiber communications, what optical phenomenon guides light along the core?',
    options: ['Total Internal Reflection', 'Diffraction', 'Polarization', 'Interference'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Light rays striking the core-cladding boundary at angles greater than the critical angle undergo Total Internal Reflection.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'What is the characteristic impedance of free space (vacuum)?',
    options: ['50 Ω', '75 Ω', '120π Ω (≈ 377 Ω)', '1000 Ω'],
    correct_answer: { type: 'mcq', value: 2 }, // 377 Ω
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'η0 = √(μ0 / ε0) = 120π ≈ 376.73 Ω.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'Which multi-access technique separates users by assigning unique mathematical pseudorandom orthogonal codes?',
    options: ['FDMA', 'TDMA', 'CDMA (Code Division Multiple Access)', 'SDMA'],
    correct_answer: { type: 'mcq', value: 2 }, // CDMA
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'CDMA uses orthogonal PN codes (like Walsh codes) to transmit multiple users over the same bandwidth simultaneously.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In FM broadcasting, pre-emphasis and de-emphasis filtering circuits are used to:',
    options: ['Boost high-frequency audio components at transmitter and attenuate them at receiver to improve SNR', 'Increase the carrier frequency', 'Reduce transmitter power', 'Eliminate multipath reflections'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'FM noise increases parabolically with frequency; pre-emphasis and de-emphasis equalize noise at higher audio frequencies.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'QAM (Quadrature Amplitude Modulation) modulates both __ and __ of the carrier signal.',
    options: ['Amplitude and Phase', 'Frequency and Wavelength', 'Phase and Polarization', 'Duty cycle and Offset'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'QAM conveys data by modulating both the amplitudes of two carrier waves in quadrature (90° phase difference).'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'The Bit Error Rate (BER) of BPSK over an AWGN channel with energy per bit Eb and noise spectral density N0 is proportional to:',
    options: ['Q(√(2 Eb / N0))', 'e^(-Eb / N0)', '1 / (Eb / N0)', 'ln(1 + Eb/N0)'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'BPSK theoretical BER in AWGN is Pb = Q(√(2Eb/N0)).'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In satellite communications, the uplink frequency is typically higher than the downlink frequency to:',
    options: ['Avoid heavy terrestrial atmospheric attenuation and keep satellite antennas small and light', 'Make ground stations cheaper', 'Prevent solar flares', 'Match TV broadcast standards'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Higher uplink frequencies allow high-gain ground stations; lower downlink frequencies experience less atmospheric path loss from the low-power satellite.'
  },
  {
    subject_name: 'Communication Systems',
    category: 'Communication Systems',
    question_type: 'mcq',
    question_text: 'In pulse modulation, Nyquist\'s First Criterion states that zero Intersymbol Interference (ISI) is achieved if the overall system impulse response has:',
    options: ['Periodic zero-crossings at integer multiples of the symbol period T_s', 'A flat frequency response up to infinity', 'Infinite duration without decay', 'Zero energy at DC'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'Nyquist criterion requires h(nTs) = 1 for n=0 and h(nTs) = 0 for all n != 0 to eliminate ISI at sampling instants.'
  },

  // ── 8. CONTROL SYSTEMS (20 Questions) ──
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'The transfer function of a system is defined as the ratio of Laplace transform of output to Laplace transform of input under the condition of:',
    options: ['Zero initial conditions', 'Maximum input amplitude', 'Unit step input', 'Harmonic excitation'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Transfer Function G(s) = Y(s) / U(s) strictly requires all initial conditions to be zero.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'In a standard second-order control system, when the damping ratio ζ = 0, the system response is:',
    options: ['Underdamped (oscillatory with decay)', 'Critically damped', 'Undamped (sustained sinusoidal oscillations)', 'Overdamped'],
    correct_answer: { type: 'mcq', value: 2 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'For ζ = 0, poles lie on the jω axis, producing undamped sustained sinusoidal oscillations at natural frequency ωn.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'According to the Routh-Hurwitz stability criterion, a linear feedback system is stable if and only if:',
    options: ['All coefficients of the characteristic equation are negative', 'There are no sign changes in the first column of the Routh array', 'The determinant of the system matrix is zero', 'All roots of the characteristic equation lie on the imaginary axis'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'The number of sign changes in the first column equals the number of right-half s-plane poles (must be zero for stability).'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'The Phase Margin (PM) of a feedback control system is measured at the:',
    options: ['Phase crossover frequency (where ∠G(jω) = -180°)', 'Gain crossover frequency (where |G(jω)| = 1 = 0 dB)', 'Resonant peak frequency', 'Zero frequency (DC)'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Phase Margin = 180° + ∠G(jω_gc), evaluated at the gain crossover frequency where |G(jω)| = 1.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'In PID controllers, the Integral (I) control action primarily helps to:',
    options: ['Improve transient speed and damping', 'Eliminate steady-state error', 'Reduce derivative kick', 'Prevent high-frequency noise amplification'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Integral action accumulates error over time, boosting system type number to drive steady-state error to zero.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'In Bode magnitude plot, a simple pole at s = -p contributes a high-frequency asymptotic slope of:',
    options: ['+20 dB/decade', '-20 dB/decade', '-40 dB/decade', '+40 dB/decade'],
    correct_answer: { type: 'mcq', value: 1 }, // -20 dB/decade
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Each simple pole introduces a roll-off slope of -20 dB/decade (-6 dB/octave) above its corner frequency.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'The Nyquist Stability Criterion determines closed-loop stability from open-loop frequency response by counting encirclements of:',
    options: ['The origin (0, 0)', 'The critical point (-1 + j0)', 'The point (+1 + j0)', 'The point (0, -j)'],
    correct_answer: { type: 'mcq', value: 1 }, // (-1 + j0)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Nyquist criterion states Z = N + P, where N is the number of clockwise encirclements of the point (-1, j0).'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'A Lead Compensator is primarily used to:',
    options: ['Increase phase margin and speed up transient response (improve stability and speed)', 'Increase steady-state gain at DC', 'Attenuate high frequencies to act as a low-pass filter', 'Introduce pure delay into the loop'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Lead compensator injects positive phase lead near crossover, increasing phase margin and bandwidth.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'For a Type-1 control system, the steady-state error to a unit ramp input is:',
    options: ['0', '1 / K_v (finite constant)', 'Infinite', 'Undetermined'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'A Type-1 system tracks step inputs with zero error, and tracks ramp inputs with a finite steady-state error ess = 1/Kv.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'In Root Locus analysis, the root loci begin at __ and terminate at __ as gain K increases from 0 to ∞.',
    options: ['Open-loop zeros, Open-loop poles', 'Open-loop poles, Open-loop zeros (or infinity)', 'The origin, Imaginary axis', 'Crossover frequencies, Nyquist points'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Root locus branches start at open-loop poles when K=0 and terminate at open-loop zeros (or asymptotes at infinity) as K->∞.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'Kalman\'s criterion for Controllability of a continuous LTI state space system (A, B) requires the controllability matrix C = [B, AB, A^2 B, ..., A^(n-1) B] to have:',
    options: ['Rank equal to n (full row rank)', 'Determinant equal to 0', 'All zero eigenvalues', 'Trace equal to 1'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'A system is controllable iff the n × nr controllability matrix has full rank n.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'The peak overshoot M_p of a standard underdamped second-order system depends only on:',
    options: ['Natural frequency ω_n', 'Damping ratio ζ', 'Static gain K', 'Input amplitude alone'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Mp = e^(-π ζ / √(1 - ζ²)) × 100%, which is a function solely of the damping ratio ζ.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'In a State Space model dx/dt = A x + B u, y = C x + D u, the matrix A is called the:',
    options: ['Input Matrix', 'System (State Dynamics) Matrix', 'Output Matrix', 'Direct Transmission (Feedthrough) Matrix'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Matrix A (n×n) represents the internal dynamics / state matrix of the system.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'What is the effect of adding a pole in the forward path of a control system on its transient response?',
    options: ['Increases system stability and speeds up response', 'Slows down the system response and makes it more oscillatory (reduces stability margin)', 'Has zero effect on root locus', 'Eliminates steady state error immediately'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Adding a pole pulls the root locus to the right, increasing rise time and decreasing relative stability.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'The 2% settling time (t_s) of a second-order underdamped system is approximately:',
    options: ['4 / (ζ · ω_n)', '1 / (ζ · ω_n)', '2π / ω_d', 'π / (2 · ζ)'],
    correct_answer: { type: 'mcq', value: 0 }, // 4 / (ζ ωn)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'For 2% tolerance band: ts ≈ 4 / (ζ ωn) = 4 / σ.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'A system has characteristic equation s^3 + 2s^2 + 4s + K = 0. What is the value of gain K for marginal stability (oscillation limit)?',
    options: ['2', '4', '8', '16'],
    correct_answer: { type: 'mcq', value: 2 }, // 2*4 - K = 0 => K = 8
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'From Routh table: s¹ row is (2·4 - K)/2 = (8 - K)/2. For marginal stability, 8 - K = 0 => K = 8.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'The state transition matrix Φ(t) = e^(At) satisfies which property at t = 0?',
    options: ['Φ(0) = 0 (Zero matrix)', 'Φ(0) = I (Identity matrix)', 'Φ(0) = A', 'Φ(0) = A^(-1)'],
    correct_answer: { type: 'mcq', value: 1 }, // Identity matrix
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'e^(A·0) = e^0 = I (Identity matrix).'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'What does the Gain Margin (GM) of a feedback control system represent?',
    options: ['The factor by which open-loop gain can be multiplied before the system becomes unstable', 'The maximum allowable phase shift before saturation', 'The ratio of output voltage to input voltage', 'The bandwidth at -3 dB'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'GM = 1 / |G(jω_pc)|, showing how much loop gain can increase before hitting instability.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'Derivative (D) control action is known for which property?',
    options: ['Anticipatory control that improves damping and reduces overshoot', 'Eliminates DC offset completely', 'Operates identically at DC and high frequency', 'Decreases noise sensitivity'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Derivative action acts on the rate of change of error, adding predictive damping to the system.'
  },
  {
    subject_name: 'Control Systems',
    category: 'Control Systems',
    question_type: 'mcq',
    question_text: 'In digital control systems, the Bilinear Transformation maps the imaginary axis of the s-plane to:',
    options: ['The unit circle |z| = 1 in the z-plane', 'The real axis of the z-plane', 'The left half of the z-plane', 'The point z = 0'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Bilinear transform s = 2/T · (z-1)/(z+1) maps the continuous jω axis strictly onto the discrete unit circle |z|=1.'
  },

  // ── 9. ELECTROMAGNETIC FIELDS & TRANSMISSION LINES (20 Questions) ──
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'Maxwell\'s equation ∇ · B = 0 (Gauss\'s Law for Magnetism) physically implies that:',
    options: ['Magnetic fields are conservative', 'Isolated magnetic monopoles do not exist (magnetic flux lines are continuous closed loops)', 'Magnetic fields cannot penetrate dielectrics', 'Time-varying electric fields produce magnetic fields'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Zero divergence of magnetic flux density B means magnetic field lines have no isolated sources or sinks (no magnetic monopoles).'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'Faraday\'s Law of Induction in differential Maxwell form is written as:',
    options: ['∇ × E = -∂B/∂t', '∇ · E = ρ / ε_0', '∇ × H = J + ∂D/∂t', '∇ · J = -∂ρ/∂t'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: '∇ × E = -∂B/∂t states that a time-varying magnetic flux generates a circulating electric field.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'The Poynting Vector S = E × H represents the:',
    options: ['Direction and instantaneous power flux density (Watts/m^2) of electromagnetic energy flow', 'Electric charge distribution on a conductor', 'Magnetic permeability of free space', 'Mechanical force on a moving charge'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'The Poynting vector S = E × H represents the directional power density (W/m²) carried by an EM wave.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'For a lossless transmission line with inductance L per unit length and capacitance C per unit length, the characteristic impedance Z_0 is:',
    options: ['Z_0 = √(L / C)', 'Z_0 = √(C / L)', 'Z_0 = 1 / √(L · C)', 'Z_0 = L × C'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'For a lossless transmission line, Z0 = √(L / C).'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'When a transmission line is terminated in a load equal to its characteristic impedance (Z_L = Z_0):',
    options: ['Voltage Reflection Coefficient Γ = 0 and VSWR = 1 (perfect matching with zero reflection)', 'Γ = 1 and VSWR = ∞', 'All power is reflected back to the source', 'Standing waves have maximum amplitude'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Γ = (ZL - Z0)/(ZL + Z0) = 0, and VSWR = (1 + |Γ|)/(1 - |Γ|) = 1, achieving complete power absorption.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'The Voltage Standing Wave Ratio (VSWR) of a short-circuited lossless transmission line (Z_L = 0) is:',
    options: ['0', '1', 'Infinity', '-1'],
    correct_answer: { type: 'mcq', value: 2 }, // Infinity
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'For short circuit, reflection coefficient |Γ| = 1. VSWR = (1 + 1) / (1 - 1) = 2 / 0 = ∞.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'Skin depth (δ) in a good conductor with conductivity σ and permeability μ at frequency f is given by:',
    options: ['δ = 1 / √(π f μ σ)', 'δ = √(π f μ σ)', 'δ = 2π / f', 'δ = σ / (2π f)'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Skin depth δ = 1 / √(π f μ σ), the depth at which wave amplitude decays to 1/e (≈37%).'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'In a rectangular waveguide, which mode CANNOT propagate?',
    options: ['TE10 (Transverse Electric)', 'TM11 (Transverse Magnetic)', 'TEM (Transverse Electromagnetic)', 'TE01'],
    correct_answer: { type: 'mcq', value: 2 }, // TEM
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Hollow single-conductor metallic waveguides cannot support TEM modes because there is no center conductor to support axial current.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'The dominant mode in a standard rectangular waveguide with broad dimension a and narrow dimension b (a > b) is:',
    options: ['TE01', 'TE10', 'TM10', 'TM01'],
    correct_answer: { type: 'mcq', value: 1 }, // TE10
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'TE10 has the lowest cutoff frequency fc = c / (2a), making it the dominant propagation mode.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'On a standard Smith Chart, the center point represents:',
    options: ['Short circuit (Z = 0)', 'Open circuit (Z = ∞)', 'Matched load (Normalized impedance z = 1 + j0)', 'Pure inductive reactance'],
    correct_answer: { type: 'mcq', value: 2 }, // z = 1 + j0
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'The center of the Smith chart corresponds to reflection coefficient Γ = 0, where normalized load z = 1.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'What is the cutoff frequency f_c for the dominant TE10 mode in an air-filled rectangular waveguide of width a = 3 cm?',
    options: ['1 GHz', '2.5 GHz', '5.0 GHz', '10 GHz'],
    correct_answer: { type: 'mcq', value: 2 }, // c / (2a) = 3e10 / 6 = 5 GHz
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'fc = c / (2a) = (3 × 10^10 cm/s) / (2 × 3 cm) = 5 × 10^9 Hz = 5.0 GHz.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'A quarter-wavelength (λ/4) transmission line transformer with characteristic impedance Z_0 transforms a load Z_L into an input impedance:',
    options: ['Z_in = Z_0^2 / Z_L', 'Z_in = Z_L', 'Z_in = Z_0 × Z_L', 'Z_in = √(Z_0 · Z_L)'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'A λ/4 transformer provides impedance inversion: Zin = Z0² / ZL.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'Displacement current density J_D was introduced into Ampere\'s circuital law by James Clerk Maxwell as:',
    options: ['J_D = ∂D / ∂t = ε · (∂E / ∂t)', 'J_D = σ · E', 'J_D = ρ · v', 'J_D = ∇ × H'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Maxwell added the displacement current term ∂D/∂t to explain magnetic field generation between capacitor plates during AC charging.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'In an electromagnetic plane wave propagating in free space, the phase relationship between the E-field and H-field is:',
    options: ['E and H are in phase and mutually orthogonal to each other and to the direction of propagation', 'E leads H by 90°', 'E and H are parallel to each other', 'E lags H by 180°'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'In a lossless uniform plane TEM wave in free space, E and H oscillate in time phase and are perpendicular in space.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'Brewster\'s Angle is the angle of incidence at which:',
    options: ['Total internal reflection occurs', 'Parallel-polarized (p-polarized) wave experiences zero reflection', 'Perpendicular-polarized wave is completely absorbed', 'Light is diffracted at 90°'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'At Brewster angle θB = arctan(n2/n1), p-polarized light has zero reflection coefficient.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'What is the velocity of electromagnetic wave propagation in a lossless non-magnetic dielectric medium with relative permittivity ε_r = 4?',
    options: ['3.0 × 10^8 m/s', '1.5 × 10^8 m/s (c / √4)', '0.75 × 10^8 m/s', '6.0 × 10^8 m/s'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'v = c / √εr = (3 × 10^8 m/s) / √4 = 1.5 × 10^8 m/s.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'A circular polarization is generated when two orthogonal linearly polarized plane waves of equal amplitude have a phase difference of:',
    options: ['0°', '±90° (π/2 radians)', '180°', '360°'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Equal amplitude and 90° phase difference between orthogonal spatial components trace a circle in time.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'Boundary conditions at a perfect electric conductor (PEC) interface require the tangential electric field E_t to be:',
    options: ['Infinite', 'Zero (E_t = 0)', 'Equal to surface charge density', 'Continuous with free space value'],
    correct_answer: { type: 'mcq', value: 1 }, // Zero
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Because electric field inside a perfect conductor is zero, tangential E must vanish at the boundary: Et = 0.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'On a Smith chart, moving clockwise around the chart corresponds to moving:',
    options: ['Toward the generator (away from load)', 'Toward the load', 'Toward higher resistance only', 'Toward negative imaginary reactance'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'One full rotation clockwise represents moving λ/2 towards the generator on the transmission line.'
  },
  {
    subject_name: 'Electromagnetic Fields',
    category: 'Electromagnetic Fields',
    question_type: 'mcq',
    question_text: 'A transmission line with reflection coefficient Γ = 0.5 has a Voltage Standing Wave Ratio (VSWR) of:',
    options: ['1.5', '2.0', '3.0', '4.0'],
    correct_answer: { type: 'mcq', value: 2 }, // (1 + 0.5)/(1 - 0.5) = 1.5 / 0.5 = 3
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'VSWR = (1 + |Γ|) / (1 - |Γ|) = (1 + 0.5) / (1 - 0.5) = 1.5 / 0.5 = 3.0.'
  },

  // ── 10. BASIC ELECTRICAL ENGINEERING & ROBOTICS (20 Questions) ──
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'Kirchhoff\'s Current Law (KCL) is based on the fundamental law of conservation of:',
    options: ['Energy', 'Charge', 'Momentum', 'Magnetic flux'],
    correct_answer: { type: 'mcq', value: 1 }, // Charge
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'KCL states that total current entering a junction equals current leaving it, conserving electrical charge.'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'Thevenin\'s Theorem replaces any linear bilateral two-terminal resistive network with:',
    options: ['An equivalent voltage source V_th in series with an equivalent resistance R_th', 'An equivalent current source I_N in parallel with R_N', 'A pure capacitance', 'A zero-impedance short circuit'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Thevenin equivalent consists of open-circuit voltage Vth in series with Thevenin resistance Rth.'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'The Maximum Power Transfer Theorem states that maximum DC power is transferred from a source to a load when:',
    options: ['R_L = 0', 'R_L = R_th (Load resistance equals source Thevenin resistance)', 'R_L = ∞', 'R_L = 2 R_th'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Maximum power transfer occurs when load impedance matches the source impedance (RL = Rth, efficiency = 50%).'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'In a 3-phase balanced star (Y) connected system, the relationship between line voltage V_L and phase voltage V_ph is:',
    options: ['V_L = V_ph', 'V_L = √3 · V_ph', 'V_L = V_ph / √3', 'V_L = 3 · V_ph'],
    correct_answer: { type: 'mcq', value: 1 }, // √3 * V_ph
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'In star connection, Line Voltage VL = √3 Vph (and Line Current IL = Phase Current Iph).'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'In an AC circuit with voltage V(t) and current I(t) lagging by phase angle θ, the Power Factor is defined as:',
    options: ['sin(θ)', 'cos(θ)', 'tan(θ)', '1 / cos(θ)'],
    correct_answer: { type: 'mcq', value: 1 }, // cos(θ)
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Power Factor = Real Power (P) / Apparent Power (S) = cos(θ).'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'The synchronous speed N_s of a 3-phase induction motor with 4 poles operating on a 50 Hz supply is:',
    options: ['1000 RPM', '1500 RPM', '3000 RPM', '750 RPM'],
    correct_answer: { type: 'mcq', value: 1 }, // 120 * 50 / 4 = 1500 RPM
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Ns = (120 × f) / P = (120 × 50) / 4 = 1500 RPM.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'In robotics, Forward Kinematics computes:',
    options: ['Joint angles required to place end-effector at a desired Cartesian position', 'The Cartesian position and orientation of the end-effector given the joint angles', 'The required joint motor torques during motion', 'Obstacle avoidance trajectories in real-time'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'Forward kinematics maps joint space angles θ to end-effector workspace coordinates (x, y, z).'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'The Denavit-Hartenberg (D-H) convention uses how many geometric parameters per robotic link?',
    options: ['2 parameters', '3 parameters', '4 parameters (link length a, link twist α, link offset d, joint angle θ)', '6 parameters'],
    correct_answer: { type: 'mcq', value: 2 }, // 4 parameters
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'D-H convention standardizes kinematic chains using 4 parameters: a_i, α_i, d_i, and θ_i.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'Which electric motor provides precise open-loop rotational position control in fixed step angle increments without requiring feedback encoders?',
    options: ['DC Brushless Motor', 'Stepper Motor', 'Induction Motor', 'Universal Motor'],
    correct_answer: { type: 'mcq', value: 1 }, // Stepper Motor
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Stepper motors rotate in discrete angular steps (e.g. 1.8° per step), enabling precise open-loop position control.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'In autonomous robot navigation, SLAM stands for:',
    options: ['Sequential Linear Algebraic Mapping', 'Simultaneous Localization and Mapping', 'Sensor Level Actuation Module', 'Synchronous LiDAR Array Multiplexing'],
    correct_answer: { type: 'mcq', value: 1 }, // Simultaneous Localization and Mapping
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'SLAM is the computational problem of constructing a map of an unknown environment while tracking agent location within it.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'The Jacobian matrix J(q) in robotic manipulator kinematics relates:',
    options: ['Joint velocities dq/dt to End-effector linear and angular velocities v', 'Joint torques to motor voltage', 'End-effector position to acceleration', 'Link mass to moment of inertia'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'The Jacobian maps joint velocity vector q_dot to workspace end-effector velocity vector: v = J(q) · q_dot.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'A SCARA robot arm has which kinematic joint configuration?',
    options: ['RRR (3 revolute spherical)', 'RRP (Selective Compliance Assembly Robot Arm: 2 parallel revolute + 1 prismatic)', 'PPP (Cartesian gantry)', 'RRRRRR (6-DOF articulated)'],
    correct_answer: { type: 'mcq', value: 1 }, // RRP
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'medium',
    explanation: 'SCARA (Selective Compliance Articulated Robot Arm) is typically RRP, compliant in XY plane and rigid along Z axis.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'LiDAR sensors measure distance to target objects by:',
    options: ['Measuring the time of flight (ToF) of emitted pulsed laser light', 'Measuring Doppler frequency shift of sound waves', 'Detecting magnetic field perturbations', 'Measuring ambient thermal infrared radiation'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'LiDAR (Light Detection and Ranging) calculates distance using laser Time-of-Flight (d = c · t / 2).'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'In an ideal transformer with primary turns N_p = 500, secondary turns N_s = 50, and primary voltage 230V AC, the secondary voltage is:',
    options: ['23V', '2300V', '115V', '46V'],
    correct_answer: { type: 'mcq', value: 0 }, // 230 * (50/500) = 23V
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Vs = Vp · (Ns / Np) = 230 · (50 / 500) = 23 V (step-down transformer).'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'At series resonance in an RLC circuit, the total impedance of the circuit is:',
    options: ['Zero', 'Minimum and purely resistive (Z = R)', 'Maximum and purely inductive', 'Infinite'],
    correct_answer: { type: 'mcq', value: 1 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'At resonance, inductive reactance cancels capacitive reactance (XL = XC), making impedance Z = R (purely resistive and minimum).'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'In industrial automation, a Programmable Logic Controller (PLC) commonly executes control logic programmed using:',
    options: ['Ladder Logic Diagram (LD)', 'HTML/CSS', 'Assembly 8086 only', 'JavaScript node engine'],
    correct_answer: { type: 'mcq', value: 0 }, // Ladder Logic
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Ladder Logic (IEC 61131-3 standard) is the industry-standard visual relay-ladder programming language for PLCs.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'Kinematic Singularity in a robot arm occurs when:',
    options: ['The Jacobian determinant det(J) = 0, causing the robot to lose one or more degrees of freedom', 'The robot battery voltage reaches zero', 'A motor overheats above 100°C', 'The end-effector touches the ground plane'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'hard',
    explanation: 'At singularities, det(J) = 0, meaning inverse kinematics requires infinite joint velocities to move in certain Cartesian directions.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'Which actuator converts pressurized fluid/compressed air into linear robotic motion?',
    options: ['Pneumatic / Hydraulic Cylinder', 'Piezoelectric buzzer', 'Strain gauge load cell', 'Permanent magnet alternator'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'Pneumatic and hydraulic cylinders utilize fluid pressure to generate high-force linear motion.'
  },
  {
    subject_name: 'Basic Electrical Engineering',
    category: 'Basic Electrical Engineering',
    question_type: 'mcq',
    question_text: 'In a residential single-phase AC power supply (230V RMS, 50 Hz), the peak voltage V_peak is approximately:',
    options: ['230 V', '325 V (230 × √2)', '400 V', '162 V'],
    correct_answer: { type: 'mcq', value: 1 }, // 230 * 1.414 = 325V
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'V_peak = V_rms × √2 = 230 V × 1.4142 ≈ 325.27 V.'
  },
  {
    subject_name: 'Robotics & Automation',
    category: 'Robotics & Automation',
    question_type: 'mcq',
    question_text: 'An IMU (Inertial Measurement Unit) sensor typically combines which two internal micro-electromechanical (MEMS) sensors?',
    options: ['Accelerometer and Gyroscope', 'Barometer and Photodiode', 'Thermistor and Hall effect sensor', 'Ultrasonic transducer and strain gauge'],
    correct_answer: { type: 'mcq', value: 0 },
    marks: 2,
    negative_marks: 0.5,
    difficulty: 'easy',
    explanation: 'IMUs fuse 3-axis accelerometer (linear acceleration) and 3-axis gyroscope (angular velocity) measurements to track 6-DOF orientation.'
  }
];
