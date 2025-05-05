import os from 'os';

const GREEN        = '\x1b[32m';
const NO_COLOR     = '\x1b[0m';
const moduleFolder = "./node_modules/yajsb/lib";
const mvCmd        = os.platform().startsWith("win") ? "move" : "mv";


async function runCommand(cmd: string, msg:string) {
  try {
    console.log(msg);
    console.log(cmd);
    const bunProcess = Bun.spawn(cmd.split(' '), {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = bunProcess.stdout ? await new Response(bunProcess.stdout).text() : '';
    const stderr = bunProcess.stderr ? await new Response(bunProcess.stderr).text() : '';

    const exitCode = await bunProcess.exited;
    if (exitCode !== 0) {
      console.error(`❌ Command failed: ${cmd}`);
      console.error(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      process.exit(1);
    } else {
      console.log(`${GREEN}✔ Command succeeded: ${cmd}${NO_COLOR}`);
      if (stdout.trim()) console.log(stdout.trim());
      if (stderr.trim()) console.log(stderr.trim());
    }
  } catch (error) {
    console.error('🚨 Erreur critique:', error);
    process.exit(1);
  }
}

function readInput(prompt: string): Promise<string> {
  const stdin  = process.stdin;
  const stdout = process.stdout;

  stdout.write(prompt);

  return new Promise((resolve) => {
    stdin.resume();
    stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

async function installYasb() {
  try {
    // Instancie un projet Bun
    await runCommand(
      "bun init",
      "📦 Project instantiation..."
    );

    // Installe la dépendance yasb
    await runCommand(
      'bun add github:fullstackbeaver/yajsb',
      "📦 Installing yasb..."
    );

    // add scripts in package.json
    console.log("📦 Ajout des scripts...");
    const packageJson = await Bun.file("./package.json").json();
    packageJson.scripts = {
      ...packageJson.scripts,
      start                   : "bun --watch run index.ts --verbose",
      updateComponentsList    : "bun run scripts.ts types",
      updateComponentsScssList: "bun run scripts.ts scss"
    };
    await Bun.write("./package.json", JSON.stringify(packageJson, null, 2));

    // add scripts.ts and templates
    await runCommand(
      `${mvCmd} ${moduleFolder}/scripts.ts ./scripts.ts`,
      "📦 Adding scripts"
    );
    await runCommand(
      `${mvCmd} ${moduleFolder}/templates ./templates`,
      "📦 Adding templates..."
    );

    // install demo site
    console.log(`${GREEN}Do you need a demo site?${NO_COLOR}`);
    console.log("(1) yes");
    console.log("(2) no");
    const rawChoice = await readInput("Select an option (default is 1): ");
    let choice = rawChoice === "" ? 1 : parseInt(rawChoice);
    if (choice > 2 || choice < 1) choice = 1;
    if ( choice === 1 ) {
      await runCommand(
        'bun add github:fullstackbeaver/yajsb-site-demo -D',
        "📦 Installation of the sample site..."
      );
      await runCommand(
        `${mvCmd} ./node_modules/yajsb-site-demo ./site`,
        "📦 Moving sample site into project..."
      );
    }
    else {
      await runCommand(
        `mkdir ./site`,
        "📦 Creating site folder..."
      )
    }

  } catch (error) {
    console.error('🚨 Fatal error:', error);
    process.exit(1);
  }
}

installYasb();