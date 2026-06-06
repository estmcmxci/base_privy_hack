export {};

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case "seed": {
      const { seedCommand } = await import("./seed");
      await seedCommand();
      break;
    }
    case "seed-demo": {
      const { seedDemoCommand } = await import("./seed-demo");
      await seedDemoCommand();
      break;
    }
    case "prediction": {
      const { predictionCommand } = await import("./prediction");
      await predictionCommand(args[0]);
      break;
    }
    case "resolve": {
      const { resolveCommand } = await import("./resolve");
      await resolveCommand();
      break;
    }
    case "pending-inspect": {
      const { pendingInspectCommand } = await import("./pending-inspect");
      await pendingInspectCommand();
      break;
    }
    case "prune-pending": {
      const { prunePendingCommand } = await import("./prune-pending");
      await prunePendingCommand();
      break;
    }
    case "tastemaker": {
      const { tastemakerCommand } = await import("./tastemaker");
      await tastemakerCommand(args[0]);
      break;
    }
    case "preview": {
      if (!args[0]) {
        console.error("Usage: pnpm cli preview <soundcloud-url>");
        process.exit(1);
      }
      const { previewCommand } = await import("./preview");
      await previewCommand(args[0]);
      break;
    }
    case "snapshot": {
      if (!args[0]) {
        console.error("Usage: pnpm cli snapshot <soundcloud-url>");
        process.exit(1);
      }
      const { snapshotCommand } = await import("./snapshot");
      await snapshotCommand(args[0]);
      break;
    }
    case "snapshot-all": {
      const { snapshotAllCommand } = await import("./snapshot-all");
      await snapshotAllCommand();
      break;
    }
    case "feed": {
      const { feedCommand } = await import("./feed");
      await feedCommand(args[0]);
      break;
    }
    case "reputation-test": {
      const { reputationTestCommand } = await import("./reputation-test");
      reputationTestCommand();
      break;
    }
    case "attest-test": {
      const { attestTestCommand } = await import("./attest-test");
      await attestTestCommand();
      break;
    }
    case "predict": {
      if (!args[0]) {
        console.error(
          "Usage: pnpm cli predict <url> --threshold <number> --horizon <1w|2w|4w|8w> --outcome <yes|no> --tastemaker <uuid>"
        );
        process.exit(1);
      }
      const { predictCommand } = await import("./predict");
      await predictCommand(args[0], args.slice(1));
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.error("Available commands: attest-test, feed, pending-inspect, predict, prediction, preview, prune-pending, reputation-test, resolve, seed, seed-demo, snapshot, snapshot-all, tastemaker");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
